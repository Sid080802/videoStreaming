import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <div className="navbar-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/upload" className="nav-link">Upload Video</Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<UploadVideo />} />
        </Routes>
      </div>
    </Router>
  );
}

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [editTitle, setEditTitle] = useState('');
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/videos`);
      setVideos(response.data);
    } catch (error) {
      console.log('Error fetching videos:', error);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleEdit = (id, title) => {
    setEditingVideoId(id);
    setEditTitle(title);
    setVideoFile(null);
  };

  const handleSaveEdit = async () => {
    if (!editTitle) return;

    const formData = new FormData();
    formData.append('title', editTitle);

    if (videoFile) {
      formData.append('video', videoFile);
    }

    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/videos/${editingVideoId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await fetchVideos(); // Re-fetch the videos to get the updated URL

      setEditingVideoId(null);
      setEditTitle('');
      setVideoFile(null);
    } catch (error) {
      console.log('Error updating video:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/videos/${id}`);
      setVideos(videos.filter(video => video._id !== id));
    } catch (error) {
      console.log('Error deleting video:', error);
    }
  };

  return (
    <div className="home-section">
      <h1 className="home-title">Video Streaming</h1>
      <div className="video-list">
        {videos.map(video => (
          <div key={video._id} className="video-item">
            {editingVideoId === video._id ? (
              <div>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="edit-title"
                />
                <input
                  type="file"
                  accept="video/mp4, video/mkv, video/avi"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  className="edit-video"
                />
                <button onClick={handleSaveEdit} className="upload-btn">Save</button>
              </div>
            ) : (
              <>
                <h3 className="video-title">{video.title}</h3>
                <video className="video-player" controls key={video.videoUrl}>
                  <source src={video.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <button onClick={() => handleEdit(video._id, video.title)} className="edit-btn">Edit</button>
                <button onClick={() => handleDelete(video._id)} className="delete-btn">Delete</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const UploadVideo = () => {
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState(null);

  const handleUpload = async () => {
    if (!title || !videoFile) {
      alert('Please fill out all fields!');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('video', videoFile);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Video uploaded successfully');
    } catch (error) {
      console.log('Error uploading video:', error);
      alert('Error uploading video');
    }
  };

  return (
    <div className="upload-section">
      <h2 className="upload-title">Upload Video</h2>
      <form className="upload-form">
        <input
          type="text"
          placeholder="Video Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="input-title"
        />
        <input
          type="file"
          accept="video/mp4, video/mkv, video/avi"
          onChange={e => setVideoFile(e.target.files[0])}
          className="input-video"
        />
        <button type="button" onClick={handleUpload} className="upload-btn">
          Upload Video
        </button>
      </form>
    </div>
  );
};

export default App;
