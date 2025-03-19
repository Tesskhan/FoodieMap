"use client";
import Layout from "../components/Layout";
import ReactPaginate from "react-paginate";
import { useState, useEffect } from "react";
import { YOUTUBE_API_KEY } from "../utils/youtube_api_key"; // Your YouTube API key
import { db } from "../firebase"; // Firebase configuration
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import "../globals.css";

// Default avatar URL
const DEFAULT_AVATAR = "https://via.placeholder.com/150";

// Helper function to extract an identifier from a YouTube URL.
// It checks for various URL formats: /channel/ (direct channel id),
// /@ (handle), or /c/ (custom URL).
const extractChannelIdentifier = (webUrl) => {
  let match = webUrl.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  match = webUrl.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  match = webUrl.match(/youtube\.com\/c\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return "";
};

export default function EditReviewers() {
  const [reviewers, setReviewers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);

  // State for new reviewer creation.
  // The Channel Name, Avatar URL and Web URL are input manually.
  // The youtubeChannelId is extracted from the Web URL,
  // and the lastVideoChecked is fetched via the Fetch Videos button.
  const [newReviewer, setNewReviewer] = useState({
    channelName: "",
    lastVideoChecked: "",
    avatarUrl: "",
    webUrl: "",
    youtubeChannelId: "",
  });

  // Update newReviewer when the Web URL changes.
  const handleWebUrlChange = (e) => {
    const webUrl = e.target.value;
    setNewReviewer({ ...newReviewer, webUrl });
  };

  // --- Functions for the Create Form (unchanged) ---

  const handleExtractChannelID = async () => {
    if (!newReviewer.webUrl) {
      alert("Please enter a valid Web URL first");
      return;
    }
    const identifier = extractChannelIdentifier(newReviewer.webUrl);
    if (!identifier) {
      alert("The Web URL does not have a recognized format");
      return;
    }
    try {
      const channelApiUrl = identifier.startsWith("UC")
        ? `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${identifier}&key=${YOUTUBE_API_KEY}`
        : `https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername=${identifier}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(channelApiUrl);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const channelInfo = data.items[0];
        const channelId = channelInfo.id;
        setNewReviewer({
          ...newReviewer,
          youtubeChannelId: channelId,
        });
      } else {
        alert("No channel found with the provided information");
      }
    } catch (error) {
      console.error("Error extracting channel ID", error);
      alert("Error extracting channel ID");
    }
  };

  const handleFetchVideos = async () => {
    if (isFetchingVideos) return;
    if (!newReviewer.youtubeChannelId) {
      alert("Please extract the Channel ID first.");
      return;
    }
    setIsFetchingVideos(true);
    try {
      const videosRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${newReviewer.youtubeChannelId}&part=snippet&order=date&maxResults=1`
      );
      const videosData = await videosRes.json();
      let lastVideoChecked = "";
      if (videosData.items && videosData.items.length > 0) {
        const latestVideo = videosData.items[0];
        lastVideoChecked = latestVideo.snippet.publishedAt;
        // Store video details in "VideosToEdit"
        await setDoc(doc(db, "VideosToEdit"), {
          channelId: newReviewer.youtubeChannelId,
          videoId: latestVideo.id.videoId || "",
          title: latestVideo.snippet.title,
          description: latestVideo.snippet.description,
          publishedAt: latestVideo.snippet.publishedAt,
          thumbnails: latestVideo.snippet.thumbnails,
          fetchedAt: new Date().toISOString(),
        });
      }
      setNewReviewer({
        ...newReviewer,
        lastVideoChecked: lastVideoChecked,
      });
    } catch (error) {
      console.error("Error fetching videos", error);
      alert("Error fetching videos");
    }
    setIsFetchingVideos(false);
  };

  // --- New Functions for Existing Reviewer Entries ---

  const handleExtractChannelIDForReviewer = async (id) => {
    const reviewer = reviewers.find((r) => r.id === id);
    if (!reviewer.webUrl) {
      alert("Please enter a valid Web URL for this reviewer first.");
      return;
    }
    const identifier = extractChannelIdentifier(reviewer.webUrl);
    if (!identifier) {
      alert("The Web URL does not have a recognized format");
      return;
    }
    try {
      const channelApiUrl = identifier.startsWith("UC")
        ? `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${identifier}&key=${YOUTUBE_API_KEY}`
        : `https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername=${identifier}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(channelApiUrl);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const channelInfo = data.items[0];
        const channelId = channelInfo.id;
        // Update the reviewer's channel ID locally...
        const updatedReviewer = { ...reviewer, youtubeChannelId: channelId };
        setReviewers((prev) =>
          prev.map((r) => (r.id === id ? updatedReviewer : r))
        );
        // ...and update Firestore.
        const reviewerRef = doc(db, "Reviewers", id);
        await setDoc(reviewerRef, { youtubeChannelId: channelId }, { merge: true });
        alert("Channel ID extracted and updated successfully.");
      } else {
        alert("No channel found with the provided information");
      }
    } catch (error) {
      console.error("Error extracting channel ID", error);
      alert("Error extracting channel ID");
    }
  };

  const handleFetchVideosForReviewer = async (id) => {
    const reviewer = reviewers.find((r) => r.id === id);
    if (!reviewer.youtubeChannelId) {
      alert("Please extract the Channel ID for this reviewer first.");
      return;
    }
    setIsFetchingVideos(true);
    try {
      const videosRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${reviewer.youtubeChannelId}&part=snippet&order=date&maxResults=1`
      );
      const videosData = await videosRes.json();
      let lastVideoChecked = "";
      if (videosData.items && videosData.items.length > 0) {
        const latestVideo = videosData.items[0];
        lastVideoChecked = latestVideo.snippet.publishedAt;
        // Store the latest video details in "VideosToEdit".
        await setDoc(doc(db, "VideosToEdit"), {
          channelId: reviewer.youtubeChannelId,
          videoId: latestVideo.id.videoId || "",
          title: latestVideo.snippet.title,
          description: latestVideo.snippet.description,
          publishedAt: latestVideo.snippet.publishedAt,
          thumbnails: latestVideo.snippet.thumbnails,
          fetchedAt: new Date().toISOString(),
        });
      }
      // Update reviewer locally...
      const updatedReviewer = { ...reviewer, lastVideoChecked };
      setReviewers((prev) =>
        prev.map((r) => (r.id === id ? updatedReviewer : r))
      );
      // ...and update Firestore.
      const reviewerRef = doc(db, "Reviewers", id);
      await setDoc(reviewerRef, { lastVideoChecked }, { merge: true });
      alert("Videos fetched and last video checked updated successfully.");
    } catch (error) {
      console.error("Error fetching videos", error);
      alert("Error fetching videos");
    }
    setIsFetchingVideos(false);
  };

  // Fetch reviewers from Firestore on component mount.
  useEffect(() => {
    const fetchReviewers = async () => {
      const querySnapshot = await getDocs(collection(db, "Reviewers"));
      const reviewersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReviewers(reviewersList);
    };
    fetchReviewers();
  }, []);

  // Filter reviewers by channel name based on the search term.
  const filteredReviewers = reviewers.filter((r) =>
    r.channelName.toLowerCase().startsWith(searchTerm.toLowerCase())
  );

  // Pagination setup.
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 1; // One card per page
  const pageCount = Math.ceil(filteredReviewers.length / itemsPerPage);
  const currentPageData = filteredReviewers.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Handle page change.
  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  // Update local reviewer value when an input changes.
  const updateLocalReviewerValue = (id, field, value) => {
    setReviewers((prevReviewers) =>
      prevReviewers.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Update a reviewer in Firestore.
  const handleUpdate = async (id) => {
    const reviewer = reviewers.find((r) => r.id === id);
    try {
      const reviewerRef = doc(db, "Reviewers", id);
      await setDoc(
        reviewerRef,
        {
          channelName: reviewer.channelName,
          lastVideoChecked: reviewer.lastVideoChecked,
          avatarUrl: reviewer.avatarUrl,
          webUrl: reviewer.webUrl,
          youtubeChannelId: reviewer.youtubeChannelId || "",
        },
        { merge: true }
      );
      console.log("Reviewer updated successfully!");
    } catch (error) {
      console.error("Error updating reviewer:", error);
    }
  };

  // Delete a reviewer from Firestore.
  const handleDelete = async (id) => {
    try {
      const reviewerRef = doc(db, "Reviewers", id);
      await deleteDoc(reviewerRef);
      setReviewers((prevReviewers) =>
        prevReviewers.filter((r) => r.id !== id)
      );
      console.log("Reviewer deleted successfully!");
    } catch (error) {
      console.error("Error deleting reviewer:", error);
    }
  };

  // Create a new reviewer in Firestore.
  // Only Channel Name is required; if youtubeChannelId is provided it is used as the document key,
  // otherwise an auto-generated key is used.
  // After creation, the new reviewer is added to the state so it displays immediately.
  const handleCreate = async () => {
    if (!newReviewer.channelName) {
      alert("Channel Name is required to add a new reviewer.");
      return;
    }
    try {
      const reviewerDoc = newReviewer.youtubeChannelId
        ? doc(db, "Reviewers", newReviewer.youtubeChannelId)
        : doc(collection(db, "Reviewers"));
      await setDoc(reviewerDoc, {
        channelName: newReviewer.channelName,
        lastVideoChecked: newReviewer.lastVideoChecked,
        avatarUrl: newReviewer.avatarUrl,
        webUrl: newReviewer.webUrl,
        youtubeChannelId: newReviewer.youtubeChannelId,
      });
      console.log("Reviewer created successfully!");
      const createdReviewer = {
        id: reviewerDoc.id,
        ...newReviewer,
      };
      setReviewers((prev) => [...prev, createdReviewer]);
      setNewReviewer({
        channelName: "",
        lastVideoChecked: "",
        avatarUrl: "",
        webUrl: "",
        youtubeChannelId: "",
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating reviewer:", error);
    }
  };

  return (
    <Layout>
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Edit Reviewers</h1>

        {/* Search box */}
        <div className="relative mt-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0);
            }}
            className="custom-input pr-8"
          />
          {searchTerm && (
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={() => setSearchTerm("")}
            >
              &#10005;
            </button>
          )}
        </div>

        {filteredReviewers.length === 0 && (
          <p className="mt-4">No reviewers found.</p>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="mt-4">
            <ReactPaginate
              previousLabel={"previous"}
              nextLabel={"next"}
              breakLabel={"..."}
              pageCount={pageCount}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handlePageClick}
              containerClassName={"pagination"}
              activeClassName={"active"}
            />
          </div>
        )}

        {/* Reviewer Cards */}
        <div className="card-container mt-6 flex flex-col items-center justify-center">
          {currentPageData.map((reviewer) => (
            <div
              key={reviewer.id}
              className="reviewer-card p-4 border rounded-lg shadow-md flex flex-col items-center justify-center"
            >
              <div className="space-y-4 w-full">
                <div className="text-center">
                  <img
                    src={reviewer.avatarUrl}
                    alt={reviewer.channelName}
                    className="w-16 h-16 rounded-full mx-auto"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_AVATAR;
                    }}
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    value={reviewer.channelName || ""}
                    onChange={(e) =>
                      updateLocalReviewerValue(
                        reviewer.id,
                        "channelName",
                        e.target.value
                      )
                    }
                    className="custom-input"
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Avatar URL
                  </label>
                  <input
                    type="text"
                    value={reviewer.avatarUrl || ""}
                    onChange={(e) =>
                      updateLocalReviewerValue(
                        reviewer.id,
                        "avatarUrl",
                        e.target.value
                      )
                    }
                    className="custom-input"
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Firebase ID
                  </label>
                  <input
                    type="text"
                    value={reviewer.id}
                    disabled
                    className="custom-input"
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Web URL
                  </label>
                  <input
                    type="text"
                    value={reviewer.webUrl || ""}
                    onChange={(e) =>
                      updateLocalReviewerValue(
                        reviewer.id,
                        "webUrl",
                        e.target.value
                      )
                    }
                    className="custom-input"
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    YouTube Channel ID
                  </label>
                  <input
                    type="text"
                    value={reviewer.youtubeChannelId || ""}
                    disabled
                    className="custom-input"
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Last Video Checked
                  </label>
                  <input
                    type="text"
                    value={reviewer.lastVideoChecked || ""}
                    onChange={(e) =>
                      updateLocalReviewerValue(
                        reviewer.id,
                        "lastVideoChecked",
                        e.target.value
                      )
                    }
                    className="custom-input"
                  />
                </div>
                <div className="flex space-x-3 mt-4 justify-center">
                  <button
                    onClick={() => handleUpdate(reviewer.id)}
                    className="custom-button bg-indigo-600 hover:bg-indigo-700"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleDelete(reviewer.id)}
                    className="custom-button bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => window.open(reviewer.webUrl, "_blank")}
                    className="custom-button bg-blue-600 hover:bg-blue-700"
                  >
                    Visit Website
                  </button>
                </div>
                {/* New buttons for existing entries */}
                <div className="flex space-x-3 mt-2 justify-center">
                  <button
                    onClick={() => handleExtractChannelIDForReviewer(reviewer.id)}
                    className="custom-button bg-yellow-600 hover:bg-yellow-700"
                  >
                    Extract Channel ID
                  </button>
                  <button
                    onClick={() => handleFetchVideosForReviewer(reviewer.id)}
                    className="custom-button bg-teal-600 hover:bg-teal-700"
                    disabled={isFetchingVideos}
                  >
                    {isFetchingVideos ? "Fetching..." : "Fetch Videos"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Button to show the create form */}
        <div className="mt-6">
          <button
            onClick={() => setShowCreateForm(true)}
            className="custom-button bg-green-600 hover:bg-green-700"
          >
            Create Reviewer
          </button>
        </div>

        {/* Create Reviewer Form */}
        {showCreateForm && (
          <div className="mt-6 card-container flex flex-col items-center justify-center">
            <div className="p-6 border rounded-lg shadow-md bg-white w-full">
              <h2 className="text-xl font-bold mb-4">Create New Reviewer</h2>
              <div className="space-y-4">
                {/* Avatar URL input */}
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Avatar URL
                  </label>
                  <input
                    type="text"
                    value={newReviewer.avatarUrl}
                    onChange={(e) =>
                      setNewReviewer({
                        ...newReviewer,
                        avatarUrl: e.target.value,
                      })
                    }
                    className="custom-input"
                  />
                  {newReviewer.avatarUrl && (
                    <img
                      src={newReviewer.avatarUrl}
                      alt="Avatar Preview"
                      className="w-12 h-12 rounded-full mt-2"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_AVATAR;
                      }}
                    />
                  )}
                </div>
                {/* Last Video Checked (auto-filled via Fetch Videos) */}
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Last Video Checked
                  </label>
                  <input
                    type="text"
                    value={newReviewer.lastVideoChecked}
                    disabled
                    className="custom-input"
                  />
                </div>
                {/* Channel Name input (required) */}
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    value={newReviewer.channelName}
                    onChange={(e) =>
                      setNewReviewer({
                        ...newReviewer,
                        channelName: e.target.value,
                      })
                    }
                    className="custom-input"
                  />
                </div>
                {/* Web URL input and button to extract Channel ID */}
                <div className="flex flex-col items-center justify-center relative">
                  <label className="block text-sm font-medium text-gray-700">
                    Web URL
                  </label>
                  <input
                    type="text"
                    value={newReviewer.webUrl}
                    onChange={handleWebUrlChange}
                    className="custom-input pr-20"
                  />
                  <button
                    onClick={handleExtractChannelID}
                    className="ml-2 custom-button bg-gray-200 hover:bg-gray-300 text-sm px-2 py-1"
                  >
                    Extract Channel ID
                  </button>
                </div>
                {/* Channel ID field with a button to fetch videos */}
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Channel ID
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={newReviewer.youtubeChannelId}
                      disabled
                      className="custom-input"
                    />
                    <button
                      onClick={handleFetchVideos}
                      className="ml-2 custom-button bg-gray-200 hover:bg-gray-300 text-sm px-2 py-1"
                      disabled={isFetchingVideos}
                    >
                      {isFetchingVideos ? "Fetching..." : "Fetch Videos"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-4 justify-center">
                <button
                  onClick={handleCreate}
                  className="custom-button bg-green-600 hover:bg-green-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="custom-button bg-red-600 hover:bg-red-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
