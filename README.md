# face-detection-tensorjs
Face Detection Tensorjs &amp; Docker 

### Quick Demo
```
docker run -p 1234:1234 harshmanvar/face-detection-tensorjs:slim-v1
```
Open URL in browser

`http://localhost:1234`

![image3](https://github.com/harsh4870/face-detection-tensorjs/assets/15871000/9132660a-a6b8-4c02-8bd8-9b8240dd2b23)

### Getting Started

![image1](https://github.com/harsh4870/face-detection-tensorjs/assets/15871000/33f9f879-04f2-45ea-8499-c1d91dcff956)

#### Building the Image

```
docker build  -t tensor-development:v1 .
```

#### Running  the Container

```
docker run -p 1234:1234 -v $(pwd):/app -v /app/node_modules tensor-development:v1 watch
```

Open URL in browser

`http://localhost:1234`

#### Monitoring container with Docker Desktop

<img width="727" alt="image4" src="https://github.com/harsh4870/face-detection-tensorjs/assets/15871000/c86003c5-435c-41ea-86b9-35b53b69bf94">
