const httpStatus = require('http-status');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { videoService } = require('../services');
const config = require('../configs/config');
const { removeVideoFile } = require('../utils/removeVideoFile');

const fileStorage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, 'uploads/');
  },
  filename(req, file, callback) {
    // const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, file.originalname);
  },
});

const uploadVideos = multer({ storage: fileStorage }).array('file', 10);

const createVideo = catchAsync(async (req, res) => {
  const reqBody = {
    ...req.body,
    addedBy: req.user._id,
  };
  const videoGroup = await videoService.createVideo(reqBody);
  res.status(httpStatus.CREATED).send(videoGroup);
});

const getVideos = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'path', 'group', 'addedBy', 'accessState']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await videoService.queryVideos(filter, options);
  res.send(result);
});

const getVideo = catchAsync(async (req, res) => {
  const user = await videoService.getVideoById(req.params.videoId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Video not found');
  }
  res.send(user);
});

const updateVideo = catchAsync(async (req, res) => {
  const user = await videoService.updateVideoById(req.params.videoId, req.body);
  res.send(user);
});

const deleteVideo = catchAsync(async (req, res) => {
  await videoService.deleteVideoById(req.params.videoId);
  res.status(httpStatus.NO_CONTENT).send();
});

const { spawn } = require('child_process');
const path = require('path');

const uploadFiles = catchAsync(async (req, res) => {
  return uploadVideos(req, res, async function (err) {
    try {
      if (err instanceof multer.MulterError) {
        res.status(500).send({ error: { message: `Multer uploading error: ${err.message}` } }).end();
        return;
      }
      if (err) {
        res.status(500).send({ error: { message: `unknown uploading error: ${err.message}` } }).end();
        return;
      }

      if (req.files && req.files.length) {
        const results = [];

        for (const file of req.files) {
          const filePath = path.join(__dirname, '..', 'uploads', file.filename);
          
          // 调用 Python 脚本进行解析，在conda环境中运行
          const pythonProcess = spawn('python', [path.join(__dirname, '../python/parse_files.py'), filePath]);
          console.log('pythonProcess', pythonProcess);

          let pythonOutput = '';
          pythonProcess.stdout.on('data', (data) => {
            pythonOutput += data.toString();
          });

          pythonProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
          });

          pythonProcess.on('close', (code) => {
            if (code === 0) {
              // 将解析的结果返回前端
              const parsedData = JSON.parse(pythonOutput);
              results.push({
                file: file.filename,
                result: parsedData,
              });

              if (results.length === req.files.length) {
                // 当所有文件都解析完毕时，返回结果
                res.status(200).json({
                  status: true,
                  message: 'Files processed successfully',
                  files: results,
                });
              }
            } else {
              res.status(500).send({ error: { message: 'Error processing file with Python script' } }).end();
            }
          });
        }
      } else {
        res.status(400).send({ message: 'No files uploaded' }).end();
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ error: { message: 'Internal server error' } }).end();
    }
  });
});

module.exports = {
  createVideo,
  getVideos,
  getVideo,
  updateVideo,
  deleteVideo,
  uploadFiles,
};
