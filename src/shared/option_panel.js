/**
 * @license
 * Copyright 2022 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as faceDetection from '@tensorflow-models/face-detection';
import * as tf from '@tensorflow/tfjs-core';

import * as params from './params';

let TUNABLE_FLAG_DEFAULT_VALUE_MAP;

const stringValueMap = {};
let backendFolder;

export async function setupModelFolder(gui, urlParams) {
  const modelFolder = gui.addFolder('Model');

  const model = urlParams.get('model') || 'mediapipe_face_detector';
  const backendFromURL = urlParams.get('backend');

  switch (model) {
    case 'mediapipe_face_detector':
      params.STATE.model = faceDetection.SupportedModels.MediaPipeFaceDetector;
      break;
    default:
      alert(`Unknown model ${urlParams.get('model')}.`);
      break;
  }

  const modelController = modelFolder.add(
      params.STATE, 'model', Object.values(faceDetection.SupportedModels));

  modelController.onChange(_ => {
    params.STATE.isModelChanged = true;
    showModelConfigs(modelFolder);
    showBackendConfigs(backendFolder);
  });

  showModelConfigs(modelFolder);

  modelFolder.open();

  backendFolder = gui.addFolder('Backend');
  params.STATE.backend = backendFromURL;

  showBackendConfigs(backendFolder);

  backendFolder.open();

  return gui;
}

export async function showBackendConfigs(folderController) {
  if (folderController == null) {
    folderController = backendFolder;
  }
  const fixedSelectionCount = 0;
  while (folderController.__controllers.length > fixedSelectionCount) {
    folderController.remove(
        folderController
            .__controllers[folderController.__controllers.length - 1]);
  }
  const backends = params.MODEL_BACKEND_MAP[params.STATE.model];
  if (params.STATE.backend == null) {
    params.STATE.backend = backends[0];
  }
  const backendController =
      folderController.add(params.STATE, 'backend', backends);
  backendController.name('runtime-backend');
  backendController.onChange(async backend => {
    params.STATE.isBackendChanged = true;
    await showFlagSettings(folderController, backend);
  });
  await showFlagSettings(folderController, params.STATE.backend);
}

function showModelConfigs(folderController) {
  // Clean up model configs for the previous model.
  // The first constroller under the `folderController` is the model
  // selection.
  const fixedSelectionCount = 1;
  while (folderController.__controllers.length > fixedSelectionCount) {
    folderController.remove(
        folderController
            .__controllers[folderController.__controllers.length - 1]);
  }

  switch (params.STATE.model) {
    case faceDetection.SupportedModels.MediaPipeFaceDetector:
      addMediaPipeFaceDetectorControllers(folderController);
      break;
    default:
      alert(`Model ${params.STATE.model} is not supported.`);
  }
}

function addMediaPipeFaceDetectorControllers(modelConfigFolder) {
  params.STATE.modelConfig = {...params.MEDIAPIPE_FACE_CONFIG};

  const boundingBoxController =
      modelConfigFolder.add(params.STATE.modelConfig, 'boundingBox');
  boundingBoxController.onChange(_ => {
    params.STATE.isModelChanged = true;
  });

  const keypointsController =
      modelConfigFolder.add(params.STATE.modelConfig, 'keypoints');
  keypointsController.onChange(_ => {
    params.STATE.isModelChanged = true;
  });

  const modelTypeController = modelConfigFolder.add(
      params.STATE.modelConfig, 'modelType', ['short', 'full']);
  modelTypeController.onChange(_ => {
    params.STATE.isModelChanged = true;
  });

  const maxFacesController =
      modelConfigFolder.add(params.STATE.modelConfig, 'maxFaces', 1, 10)
          .step(1);
  maxFacesController.onChange(_ => {
    // Set isModelChanged to true, so that we don't render any result during
    // changing models.
    params.STATE.isModelChanged = true;
  });
}

async function initDefaultValueMap() {
  TUNABLE_FLAG_DEFAULT_VALUE_MAP = {};
  params.STATE.flags = {};
  for (const backend in params.BACKEND_FLAGS_MAP) {
    for (let index = 0; index < params.BACKEND_FLAGS_MAP[backend].length;
         index++) {
      const flag = params.BACKEND_FLAGS_MAP[backend][index];
      TUNABLE_FLAG_DEFAULT_VALUE_MAP[flag] = await tf.env().getAsync(flag);
    }
  }

  for (const flag in TUNABLE_FLAG_DEFAULT_VALUE_MAP) {
    if (params.BACKEND_FLAGS_MAP[params.STATE.backend].indexOf(flag) > -1) {
      params.STATE.flags[flag] = TUNABLE_FLAG_DEFAULT_VALUE_MAP[flag];
    }
  }
}


function getTunableRange(flag) {
  const defaultValue = TUNABLE_FLAG_DEFAULT_VALUE_MAP[flag];
  if (flag === 'WEBGL_FORCE_F16_TEXTURES') {
    return [false, true];
  } else if (flag === 'WEBGL_VERSION') {
    const tunableRange = [];
    for (let value = 1; value <= defaultValue; value++) {
      tunableRange.push(value);
    }
    return tunableRange;
  } else if (flag === 'WEBGL_FLUSH_THRESHOLD') {
    const tunableRange = [-1];
    for (let value = 0; value <= 2; value += 0.25) {
      tunableRange.push(value);
    }
    return tunableRange;
  } else if (typeof defaultValue === 'boolean') {
    return defaultValue ? [false, true] : [false];
  } else if (params.TUNABLE_FLAG_VALUE_RANGE_MAP[flag] != null) {
    return params.TUNABLE_FLAG_VALUE_RANGE_MAP[flag];
  } else {
    return [defaultValue];
  }
}

function showBackendFlagSettings(folderController, backendName) {
  const tunableFlags = params.BACKEND_FLAGS_MAP[backendName];
  for (let index = 0; index < tunableFlags.length; index++) {
    const flag = tunableFlags[index];
    const flagName = params.TUNABLE_FLAG_NAME_MAP[flag] || flag;


    const flagValueRange = getTunableRange(flag);

    if (flagValueRange.length < 2) {
      console.warn(
          `The ${flag} is considered as untunable, ` +
          `because its value range is [${flagValueRange}].`);
      continue;
    }

    let flagController;
    if (typeof flagValueRange[0] === 'boolean') {
    
      flagController = folderController.add(params.STATE.flags, flag);
    } else {
      
      flagController =
          folderController.add(params.STATE.flags, flag, flagValueRange);

      if (stringValueMap[flag] == null) {
        stringValueMap[flag] = {};
        for (let index = 0; index < flagValueRange.length; index++) {
          const realValue = flagValueRange[index];
          const stringValue = String(flagValueRange[index]);
          stringValueMap[flag][stringValue] = realValue;
        }
      }
      flagController.onFinishChange(stringValue => {
        params.STATE.flags[flag] = stringValueMap[flag][stringValue];
      });
    }
    flagController.name(flagName).onChange(() => {
      params.STATE.isFlagChanged = true;
    });
  }
}

async function showFlagSettings(folderController, backendName) {
  await initDefaultValueMap();

  const fixedSelectionCount = 1;
  while (folderController.__controllers.length > fixedSelectionCount) {
    folderController.remove(
        folderController
            .__controllers[folderController.__controllers.length - 1]);
  }

  showBackendFlagSettings(folderController, backendName);
}
