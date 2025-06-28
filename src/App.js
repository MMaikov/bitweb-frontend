import logo from './logo.svg';
import './App.css';

import axios from "axios";
import React, {useState} from "react";

function bytesToReadableFormat(bytes) {
  if (bytes > 1000) {
    bytes /= 1000;
    if (bytes > 1000) {
      bytes /= 1000;
      if (bytes > 1000) {
        bytes /= 1000;
        return bytes + "GB";
      } else {
        return bytes + "MB";
      }
    } else {
      return bytes + " KB";
    }
  } else {
    return bytes + "B";
  }
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [id, setID] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [polling, setPolling] = useState(false);
  const [status, setStatus] = useState("idle");

  const onFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  }

  const onFileUpload = () => {
    if (selectedFile.size >= 100e6) {
      alert("File is too big! Below 100MB!");
      return;
    }
    const formData = new FormData();
    formData.append(
      "file",
      selectedFile
    );
    console.log(selectedFile);
    axios.post("http://localhost:8080/upload", formData).then(r => {
      console.log(r.data);
      setID(r.data);
      pollStatus(r.data);
    });
  }

  const pollStatus = (jobID) => {
    if (jobID === null) {
      return;
    }
    setPolling(true);
    const intervalID = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8080/upload/${jobID}`);
        const data = await res.json();
        setStatus(data.status);
        setResultData(data);
        if (data.status === "done") {
          clearInterval(intervalID);
          setPolling(false);
        }
      } catch (error) {
        console.error("Polling failed:", error);
        clearInterval(intervalID);
        setPolling(false);
        setStatus("error");
      }
    }, 2000);
  };

  const fileData = () => {
    if (selectedFile) {
      return (
        <div>
          <h2>File details:</h2>
          <p>File Name: {selectedFile.name}</p>
          <p>File Type: {selectedFile.type}</p>
          <p>File Size: {bytesToReadableFormat(selectedFile.size)}</p>
          <p>
            Last modified: {new Date(selectedFile.lastModified).toUTCString()}
          </p>
        </div>
      );
    } else {
      return null;
    }
  };

  const workResult = () => {
    if (id) {
      return (
        <div>
          <p>UUID: {id}</p>
          <p>Status: {status}</p>
          <p>Result: {JSON.stringify(resultData, null, 2)}</p>
        </div>
      );
    } else {
      return null;
    }
  };

  return (
    <div>
      <h1>Word cloud</h1>
      <div>
        <input type="file" onChange={onFileChange} />
        <button onClick={onFileUpload} disabled={polling}>Upload!</button>
      </div>
      {fileData()}
      {workResult()}
    </div>
  );
}

export default App;
