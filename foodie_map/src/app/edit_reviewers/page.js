"use client";
import Layout from "../components/Layout";
import ReactPaginate from "react-paginate";
import { useState, useEffect } from "react";
import { YOUTUBE_API_KEY } from "../utils/apiKeys"; // Your YouTube API key
import { db } from "../firebase"; // Firebase configuration
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import "../globals.css";

// Default avatar URL if no image is provided
const DEFAULT_AVATAR = "https://th.bing.com/th/id/R.0ababdb27dd0bb71f21f03c98b6cd6f1?rik=%2fiVDxahrgNztPA&pid=ImgRaw&r=0";

/**
 * Extracts a potential identifier (handle, custom URL, or channel ID) from a given YouTube URL.
 * This function checks for URLs that contain:
 * - /channel/ (direct channel id)
 * - /@ (channel handle)
 * - /c/ (custom channel URL)
 *
 * @param {string} webUrl - The YouTube URL to extract from.
 * @returns {string} The extracted identifier or an empty string if not found.
 */
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
  // State to store all reviewer documents fetched from Firestore.
  const [reviewers, setReviewers] = useState([]);
  // State to toggle display of the create reviewer form.
  const [showCreateForm, setShowCreateForm] = useState(false);
  // State to store the search term for filtering reviewers.
  const [searchTerm, setSearchTerm] = useState("");
  // State to indicate whether videos are currently being fetched.
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);

  // State for the new reviewer being created.
  // Channel Name is required; others are optional and may be updated later.
  const [newReviewerData, setNewReviewerData] = useState({
    channelName: "",
    lastVideoChecked: "",
    avatarUrl: "",
    webUrl: "",
    youtubeChannelId: "",
  });

  // Pagination state for displaying reviewer cards.
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 1; // Display one reviewer card per page

  // Filter reviewers based on the search term (case-insensitive).
  const filteredReviewers = reviewers.filter((r) =>
    r.channelName.toLowerCase().startsWith(searchTerm.toLowerCase())
  );
  const pageCount = Math.ceil(filteredReviewers.length / itemsPerPage);
  const currentPageData = filteredReviewers.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // ------------------ Firestore Data Fetching ------------------

  /**
   * Fetches reviewer documents from Firestore and sets the reviewers state.
   */
  useEffect(() => {
    const fetchReviewersFromFirestore = async () => {
      const querySnapshot = await getDocs(collection(db, "Reviewers"));
      const reviewersList = querySnapshot.docs.map((doc) => ({
        id: doc.id, // Firestore document ID
        ...doc.data(),
      }));
      setReviewers(reviewersList);
    };
    fetchReviewersFromFirestore();
  }, []);

  // ------------------ Search Handler ------------------

  /**
   * Handles changes to the search input and resets pagination.
   */
  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  };

  // ------------------ New Reviewer Creation Functions ------------------

  /**
   * Handles changes to the new reviewer's web URL.
   */
  const handleNewReviewerWebUrlChange = (e) => {
    const webUrl = e.target.value;
    setNewReviewerData({ ...newReviewerData, webUrl });
  };

  /**
   * Extracts the channel ID for a new reviewer using the YouTube search endpoint.
   * Uses the extracted identifier (handle, etc.) as the query parameter.
   */
  const extractChannelIdForNewReviewer = async () => {
    if (!newReviewerData.webUrl) {
      alert("Please enter a valid Web URL first");
      return;
    }
    const identifier = extractChannelIdentifier(newReviewerData.webUrl);
    if (!identifier) {
      alert("The Web URL does not have a recognized format");
      return;
    }
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${identifier}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(searchUrl);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        // Use the channelId from the search results.
        const channelId = data.items[0].id.channelId;
        setNewReviewerData({ ...newReviewerData, youtubeChannelId: channelId });
      } else {
        alert("No channel found with the provided information");
      }
    } catch (error) {
      console.error("Error extracting channel ID", error);
      alert("Error extracting channel ID");
    }
  };

  /**
   * Loads the latest videos for the new reviewer by calling the YouTube API.
   * Updates the 'lastVideoChecked' field and stores the video details in the 'VideosToEdit' Firestore collection.
   */
  const fetchVideosForNewReviewer = async () => {
    if (isFetchingVideos) return;
    if (!newReviewerData.youtubeChannelId) {
      alert("Please extract the Channel ID first.");
      return;
    }
    setIsFetchingVideos(true);
    try {
      const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${newReviewerData.youtubeChannelId}&maxResults=50&order=date&pageToken=&key=${YOUTUBE_API_KEY}`;
      const videosRes = await fetch(videosUrl);
      const videosData = await videosRes.json();
      let lastVideoChecked = "";
      if (videosData.items && videosData.items.length > 0) {
        const latestVideo = videosData.items[0];
        lastVideoChecked = latestVideo.snippet.publishedAt;
        // Save the latest video details in the "VideosToEdit" collection.
        await setDoc(doc(db, "VideosToEdit"), {
          channelId: newReviewerData.youtubeChannelId,
          videoId: latestVideo.id.videoId || "",
          title: latestVideo.snippet.title,
          description: latestVideo.snippet.description,
          publishedAt: latestVideo.snippet.publishedAt,
          thumbnails: latestVideo.snippet.thumbnails,
          fetchedAt: new Date().toISOString(),
        });
      }
      setNewReviewerData({ ...newReviewerData, lastVideoChecked });
    } catch (error) {
      console.error("Error fetching videos", error);
      alert("Error fetching videos");
    }
    setIsFetchingVideos(false);
  };

  /**
   * Creates a new reviewer document in Firestore using the newReviewerData state.
   * If a YouTube channel ID exists, it is used as the document ID.
   * Upon successful creation, the new reviewer is added to local state.
   */
  const createNewReviewer = async () => {
    if (!newReviewerData.channelName || !newReviewerData.webUrl) {
      alert("Channel Name and Web URL are required to add a new reviewer.");
      return;
    }
    try {
      const reviewerDoc = newReviewerData.youtubeChannelId
        ? doc(db, "Reviewers", newReviewerData.youtubeChannelId)
        : doc(collection(db, "Reviewers"));
      await setDoc(reviewerDoc, {
        channelName: newReviewerData.channelName,
        lastVideoChecked: newReviewerData.lastVideoChecked,
        avatarUrl: newReviewerData.avatarUrl,
        webUrl: newReviewerData.webUrl,
        youtubeChannelId: newReviewerData.youtubeChannelId,
      });
      console.log("Reviewer created successfully!");
      const createdReviewer = { id: reviewerDoc.id, ...newReviewerData };
      setReviewers((prev) => [...prev, createdReviewer]);
      // Clear new reviewer form fields.
      setNewReviewerData({
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

  // ------------------ Existing Reviewer Update Functions ------------------

  /**
   * Extracts the channel ID for an existing reviewer.
   * Uses the YouTube search endpoint and updates both local state and Firestore.
   *
   * @param {string} reviewerId - The Firestore document ID of the reviewer.
   */
  const extractChannelIdForExistingReviewer = async (reviewerId) => {
    const reviewer = reviewers.find((r) => r.id === reviewerId);
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
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${identifier}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(searchUrl);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const channelId = data.items[0].id.channelId;
        const updatedReviewer = { ...reviewer, youtubeChannelId: channelId };
        // Update the reviewer in local state.
        setReviewers((prev) =>
          prev.map((r) => (r.id === reviewerId ? updatedReviewer : r))
        );
        // Update the reviewer document in Firestore.
        const reviewerRef = doc(db, "Reviewers", reviewerId);
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

  /**
   * Fetches the latest videos for an existing reviewer using the YouTube API.
   * Updates the reviewer's "lastVideoChecked" field in local state and Firestore,
   * and stores the video details in the "VideosToEdit" collection.
   *
   * @param {string} reviewerId - The Firestore document ID of the reviewer.
   */
  const fetchVideosForExistingReviewer = async (reviewerId) => {
    const reviewer = reviewers.find((r) => r.id === reviewerId);
    if (!reviewer.youtubeChannelId) {
      alert("Please extract the Channel ID for this reviewer first.");
      return;
    }
    setIsFetchingVideos(true);
    try {
      const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${reviewer.youtubeChannelId}&maxResults=50&order=date&pageToken=&key=${YOUTUBE_API_KEY}`;
      const videosRes = await fetch(videosUrl);
      const videosData = await videosRes.json();
      let lastVideoChecked = "";
      if (videosData.items && videosData.items.length > 0) {
        const latestVideo = videosData.items[0];
        lastVideoChecked = latestVideo.snippet.publishedAt;
        // Save the latest video details in the "VideosToEdit" collection.
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
      const updatedReviewer = { ...reviewer, lastVideoChecked };
      // Update local state.
      setReviewers((prev) =>
        prev.map((r) => (r.id === reviewerId ? updatedReviewer : r))
      );
      // Update Firestore.
      const reviewerRef = doc(db, "Reviewers", reviewerId);
      await setDoc(reviewerRef, { lastVideoChecked }, { merge: true });
      alert("Videos fetched and last video checked updated successfully.");
    } catch (error) {
      console.error("Error fetching videos", error);
      alert("Error fetching videos");
    }
    setIsFetchingVideos(false);
  };

  /**
   * Updates an existing reviewer document in Firestore with the local state values.
   *
   * @param {string} reviewerId - The Firestore document ID of the reviewer.
   */
  const updateReviewerInFirestore = async (reviewerId) => {
    const reviewer = reviewers.find((r) => r.id === reviewerId);
    try {
      const reviewerRef = doc(db, "Reviewers", reviewerId);
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

  /**
   * Deletes a reviewer from Firestore and updates the local state.
   *
   * @param {string} reviewerId - The Firestore document ID of the reviewer.
   */
  const deleteReviewer = async (reviewerId) => {
    try {
      const reviewerRef = doc(db, "Reviewers", reviewerId);
      await deleteDoc(reviewerRef);
      setReviewers((prev) => prev.filter((r) => r.id !== reviewerId));
      console.log("Reviewer deleted successfully!");
    } catch (error) {
      console.error("Error deleting reviewer:", error);
    }
  };

  /**
   * Handler for pagination page changes.
   *
   * @param {object} data - Pagination data containing the selected page index.
   */
  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  /**
   * Updates a single field for a reviewer in the local state.
   *
   * @param {string} reviewerId - The Firestore document ID of the reviewer.
   * @param {string} fieldName - The field name to update.
   * @param {string} newValue - The new value for the field.
   */
  const updateReviewerField = (reviewerId, fieldName, newValue) => {
    setReviewers((prev) =>
      prev.map((r) => (r.id === reviewerId ? { ...r, [fieldName]: newValue } : r))
    );
  };

  // ------------------ UI Rendering ------------------

  return (
    <Layout>
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Edit Reviewers</h1>

        {/* Search Box */}
        <div className="relative mt-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={handleSearchTermChange}
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
                {/* Avatar Image */}
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
                {/* Channel Name */}
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    value={reviewer.channelName || ""}
                    onChange={(e) =>
                      updateReviewerField(reviewer.id, "channelName", e.target.value)
                    }
                    className="custom-input"
                  />
                </div>
                {/* Avatar URL */}
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Avatar URL
                  </label>
                  <input
                    type="text"
                    value={reviewer.avatarUrl || ""}
                    onChange={(e) =>
                      updateReviewerField(reviewer.id, "avatarUrl", e.target.value)
                    }
                    className="custom-input"
                  />
                </div>
                {/* Firebase Document ID */}
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
                {/* Web URL */}
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Web URL
                  </label>
                  <input
                    type="text"
                    value={reviewer.webUrl || ""}
                    onChange={(e) =>
                      updateReviewerField(reviewer.id, "webUrl", e.target.value)
                    }
                    className="custom-input"
                  />
                </div>
                {/* YouTube Channel ID */}
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
                {/* Last Video Checked */}
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Last Video Checked
                  </label>
                  <input
                    type="text"
                    value={reviewer.lastVideoChecked || ""}
                    onChange={(e) =>
                      updateReviewerField(reviewer.id, "lastVideoChecked", e.target.value)
                    }
                    className="custom-input"
                  />
                </div>
                {/* Action Buttons */}
                <div className="flex space-x-3 mt-4 justify-center">
                  <button
                    onClick={() => updateReviewerInFirestore(reviewer.id)}
                    className="custom-button bg-indigo-600 hover:bg-indigo-700"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => deleteReviewer(reviewer.id)}
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
                {/* Extra Buttons for Existing Reviewer */}
                <div className="flex space-x-3 mt-2 justify-center">
                  <button
                    onClick={() => extractChannelIdForExistingReviewer(reviewer.id)}
                    className="custom-button bg-yellow-600 hover:bg-yellow-700"
                  >
                    Extract Channel ID
                  </button>
                  <button
                    onClick={() => fetchVideosForExistingReviewer(reviewer.id)}
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

        {/* Button to open Create Reviewer Form */}
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
                {/* New Reviewer Avatar URL */}
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Avatar URL
                  </label>
                  <img
                    src={newReviewerData.avatarUrl || DEFAULT_AVATAR}
                    alt="Avatar Preview"
                    style={{ width: "3.5rem", height: "3.5rem" }}
                    className="rounded-full mt-2"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_AVATAR;
                    }}
                  />
                  <input
                    type="text"
                    value={newReviewerData.avatarUrl}
                    onChange={(e) =>
                      setNewReviewerData({
                        ...newReviewerData,
                        avatarUrl: e.target.value,
                      })
                    }
                    className="custom-input"
                  />
                </div>
                {/* New Reviewer Channel Name */}
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    value={newReviewerData.channelName}
                    onChange={(e) =>
                      setNewReviewerData({
                        ...newReviewerData,
                        channelName: e.target.value,
                      })
                    }
                    className="custom-input"
                  />
                </div>
                {/* New Reviewer Web URL and Extract Channel ID Button */}
                <div className="flex flex-col items-center justify-center relative">
                  <label className="block text-sm font-medium text-gray-700">
                    Web URL
                  </label>
                  <input
                    type="text"
                    value={newReviewerData.webUrl}
                    onChange={handleNewReviewerWebUrlChange}
                    className="custom-input pr-20"
                  />
                  <button
                    onClick={extractChannelIdForNewReviewer}
                    className="ml-2 custom-button bg-gray-200 hover:bg-gray-300 text-sm px-2 py-1"
                  >
                    Extract Channel ID
                  </button>
                </div>
                {/* New Reviewer Channel ID and Fetch Videos Button */}
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Channel ID
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={newReviewerData.youtubeChannelId}
                      disabled
                      className="custom-input"
                    />
                    <button
                      onClick={fetchVideosForNewReviewer}
                      className="ml-2 custom-button bg-gray-200 hover:bg-gray-300 text-sm px-2 py-1"
                      disabled={isFetchingVideos}
                    >
                      {isFetchingVideos ? "Fetching..." : "Fetch Videos"}
                    </button>
                  </div>
                </div>
              </div>
              {/* New Reviewer Last Video Checked */}
              <div className="flex flex-col items-center justify-center">
                <label className="block text-sm font-medium text-gray-700">
                  Last Video Checked
                </label>
                <input
                  type="text"
                  value={newReviewerData.lastVideoChecked}
                  disabled
                  className="custom-input"
                />
              </div>
              {/* Create/Cancel Buttons */}
              <div className="flex space-x-3 mt-4 justify-center">
                <button
                  onClick={createNewReviewer}
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
