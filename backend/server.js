require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const cors = require('cors'); // Import cors

const app = express();
const port = 5000;

// Enable CORS
app.use(cors());
app.use(express.json()); // For handling JSON requests

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Mongoose connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB connection error:", err));

// Video Schema
const videoSchema = new mongoose.Schema({
  title: String,
  videoUrl: String,
});

const Video = mongoose.model('Video', videoSchema);

// Multer setup (memory storage for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('video');

// Routes

// Upload video
app.post('/upload', upload, async (req, res) => {
  const { title } = req.body;
  if (!title || !req.file) {
    return res.status(400).send({ message: 'Title and video file are required.' });
  }

  const uploadStream = cloudinary.uploader.upload_stream(
    { resource_type: 'video' }, 
    async (error, result) => {
      if (error) {
        return res.status(500).send({ message: 'Error uploading video', error });
      }

      const videoUrl = result.secure_url;

      // Save video information in the database
      const newVideo = new Video({ title, videoUrl });
      await newVideo.save();

      res.status(201).send({ message: 'Video uploaded successfully', video: newVideo });
    }
  );

  // Convert buffer to stream and upload it to Cloudinary
  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
});

// Get all videos
app.get('/videos', async (req, res) => {
  try {
    const videos = await Video.find();
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching videos from database.' });
  }
});

// Edit video title (and video file if provided)
app.put('/videos/:id', upload, async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title) {
    return res.status(400).send({ message: 'Title is required.' });
  }

  try {
    let videoUrl = null;

    // If a new video file is uploaded, upload it to Cloudinary
    if (req.file) {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'video' },
        async (error, result) => {
          if (error) {
            return res.status(500).send({ message: 'Error uploading video', error });
          }
          videoUrl = result.secure_url;

          const updatedVideo = await Video.findByIdAndUpdate(id, { title, videoUrl }, { new: true });

          if (!updatedVideo) {
            return res.status(404).send({ message: 'Video not found' });
          }

          res.status(200).send({ message: 'Video updated successfully', video: updatedVideo });
        }
      );
      
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    } else {
      // Update title only if no new video file is uploaded
      const updatedVideo = await Video.findByIdAndUpdate(id, { title }, { new: true });
      if (!updatedVideo) {
        return res.status(404).send({ message: 'Video not found' });
      }
      res.status(200).send({ message: 'Video updated successfully', video: updatedVideo });
    }
  } catch (error) {
    res.status(500).send({ message: 'Error updating video', error });
  }
});

// Delete video
app.delete('/videos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const video = await Video.findByIdAndDelete(id);
    if (!video) {
      return res.status(404).send({ message: 'Video not found' });
    }
    res.status(200).send({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Error deleting video', error });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
