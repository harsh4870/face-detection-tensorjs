import {setupModelFolder} from './shared/option_panel';
import * as params from './shared/params';

export async function setupDatGui(urlParams) {
  const gui = new dat.GUI({width: 300});
  gui.domElement.id = 'gui';

  const cameraFolder = gui.addFolder('Camera');
  const fpsController = cameraFolder.add(params.STATE.camera, 'targetFPS');
  fpsController.onFinishChange((_) => {
    params.STATE.isTargetFPSChanged = true;
  });
  const sizeController = cameraFolder.add(
      params.STATE.camera, 'sizeOption', Object.keys(params.VIDEO_SIZE));
  sizeController.onChange(_ => {
    params.STATE.isSizeOptionChanged = true;
  });
  cameraFolder.open();

  return setupModelFolder(gui, urlParams);
}