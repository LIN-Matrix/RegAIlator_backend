const httpStatus = require('http-status');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { videoService } = require('../services');
const config = require('../configs/config');
const { removeVideoFile } = require('../utils/removeVideoFile');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // 用于生成唯一的文件名
const { spawn } = require('child_process');
const { title } = require('process');
const { group } = require('console');
const mime = require('mime'); // 导入mime模块

const fileStorage = multer.diskStorage({
  destination(req, file, callback) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    callback(null, uploadDir);
  },
  filename(req, file, callback) {
    const uniqueFileName = `${uuidv4()}.pdf`;
    callback(null, uniqueFileName);
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

const uploadFiles = catchAsync(async (req, res) => {
  return uploadVideos(req, res, async function (err) {
      try {
          if (err instanceof multer.MulterError) {
              return res.status(500).send({ error: { message: `Multer uploading error: ${err.message}` } });
          }
          if (err) {
              return res.status(500).send({ error: { message: `unknown uploading error: ${err.message}` } });
          }

          if (req.files && req.files.length) {
              const results = [];
              for (const file of req.files) {
                  const filePath = path.join(__dirname, '../..', 'uploads', file.filename); // file.filename 已经是唯一名称
                  const fileUrl = `/api/uploads/${file.filename}`;
                  
                  // 调用 Python 脚本进行解析
                  const pythonProcess = spawn('python', [path.join(__dirname, '../python/parse_files.py'), filePath]);

                  let pythonOutput = '';
                  pythonProcess.stdout.on('data', (data) => {
                      pythonOutput += data.toString();
                  });

                  pythonProcess.stderr.on('data', (data) => {
                      console.error(`stderr: ${data}`);
                  });

                  pythonProcess.on('close', async (code) => {
                      if (code === 0) {
                          const parsedData = JSON.parse(pythonOutput);
                          console.log(parsedData);
                          results.push({
                              file: file.filename,
                              result: parsedData,
                          });

                          // 存储文件信息到数据库
                          await videoService.createVideo({
                              title: file.originalname, // 保留原始文件名
                              path: fileUrl,
                              group: req.body.group,
                              accessState: "private",
                              addedBy: req.user._id,
                              json: parsedData // 如果你想存储解析的数据
                          });

                          if (results.length === req.files.length) {
                              res.status(200).json({
                                  status: true,
                                  message: 'Files processed successfully',
                                  files: results,
                              });
                          }
                      } else {
                          res.status(500).send({ error: { message: 'Error processing file with Python script' } });
                      }
                  });
              }
          } else {
              res.status(400).send({ message: 'No files uploaded' });
          }
      } catch (e) {
          console.error(e);
          res.status(500).send({ error: { message: 'Internal server error' } });
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
