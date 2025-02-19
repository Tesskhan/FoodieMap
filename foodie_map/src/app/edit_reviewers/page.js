"use client";
import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { db } from "../firebase"; // Import Firebase config
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore"; // Firestore methods
import "../globals.css";

export default function EditReviewers() {
  const [reviewers, setReviewers] = useState([]); // Array to store all reviewers
  const [selectedReviewer, setSelectedReviewer] = useState(null); // Selected reviewer for editing
  const [channelName, setChannelName] = useState("");
  const [channelId, setChannelId] = useState("");
  const [lastVideoChecked, setLastVideoChecked] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false); // State to control form visibility

  // Fetch reviewers from Firestore
  useEffect(() => {
    const fetchReviewers = async () => {
      const querySnapshot = await getDocs(collection(db, "reviewers"));
      const reviewersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReviewers(reviewersList);
    };

    fetchReviewers();
  }, []);

  // Handle selecting a reviewer to edit
  const handleCardClick = (reviewer) => {
    setSelectedReviewer(reviewer);
    setChannelName(reviewer.channelName);
    setChannelId(reviewer.id); // Use the Firestore document ID as the channel ID
    setLastVideoChecked(reviewer.lastVideoChecked);
    setAvatarUrl(reviewer.avatarUrl);
    setWebUrl(reviewer.webUrl);
  };

  const handleUpdate = async () => {
    try {
      const reviewerRef = doc(db, "reviewers", channelId); // Collection name 'reviewers', using 'channelId' as the doc ID
      await setDoc(reviewerRef, {
        channelName,
        lastVideoChecked,
        avatarUrl,
        webUrl,
      }, { merge: true }); // Merge to update only specific fields
      console.log("Reviewer updated successfully!");
    } catch (error) {
      console.error("Error updating reviewer:", error);
    }
  };

  const handleDelete = async () => {
    try {
      const reviewerRef = doc(db, "reviewers", channelId); // Collection name 'reviewers', using 'channelId' as the doc ID
      await deleteDoc(reviewerRef);
      console.log("Reviewer deleted successfully!");
      // Reset form after deletion
      setSelectedReviewer(null);
      setChannelName("");
      setChannelId("");
      setLastVideoChecked("");
      setAvatarUrl("");
      setWebUrl("");
    } catch (error) {
      console.error("Error deleting reviewer:", error);
    }
  };

  const handleCreate = async () => {
    try {
      const newReviewerRef = doc(collection(db, "reviewers")); // Generate a new document reference
      await setDoc(newReviewerRef, {
        channelName,
        lastVideoChecked,
        avatarUrl,
        webUrl,
      });
      console.log("Reviewer created successfully!");
      // Reset form after creating a new reviewer
      setChannelName("");
      setChannelId("");
      setLastVideoChecked("");
      setAvatarUrl("");
      setWebUrl("");
      setShowCreateForm(false); // Hide the form after creation
    } catch (error) {
      console.error("Error creating reviewer:", error);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Edit Reviewers</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {reviewers.map((reviewer) => (
            <div
              key={reviewer.id}
              className="p-4 border rounded-lg shadow-md hover:shadow-lg cursor-pointer"
              onClick={() => handleCardClick(reviewer)}
            >
              <h2 className="text-lg font-semibold">{reviewer.channelName}</h2>
              <p className="text-sm text-gray-500">{reviewer.lastVideoChecked}</p>
              <img src={reviewer.avatarUrl} alt={reviewer.channelName} className="h-12 w-12 rounded-full" />
            </div>
          ))}
        </div>

        {selectedReviewer && (
          <div className="mt-6 p-6 border rounded-lg">
            <h2 className="text-xl font-bold">Edit {selectedReviewer.channelName}</h2>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Channel Name</label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm custom-input"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Channel ID</label>
              <input
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm custom-input"
                disabled
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Last Video Checked</label>
              <input
                type="text"
                value={lastVideoChecked}
                onChange={(e) => setLastVideoChecked(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm custom-input"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Avatar URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm custom-input"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Web URL</label>
              <input
                type="text"
                value={webUrl}
                onChange={(e) => setWebUrl(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm custom-input"
              />
            </div>

            <div className="mt-4">
              <button
                onClick={handleUpdate}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 custom-button"
              >
                Update
              </button>
              <button
                onClick={handleDelete}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 custom-button"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Create Reviewer Button */}
        <div className="mt-6">
          <button
            onClick={() => setShowCreateForm(true)} // Show the create form
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 custom-button"
          >
            Create Reviewer
          </button>
        </div>

        {/* Form for Creating Reviewer */}
        {showCreateForm && (
          <div className="mt-6 p-6 border rounded-lg">
            <h2 className="text-xl font-bold">Create New Reviewer</h2>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Channel Name</label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm custom-input"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Last Video Checked</label>
              <input
                type="text"
                value={lastVideoChecked}
                onChange={(e) => setLastVideoChecked(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm custom-input"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Avatar URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm custom-input"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Web URL</label>
              <input
                type="text"
                value={webUrl}
                onChange={(e) => setWebUrl(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm custom-input"
              />
            </div>

            <div className="mt-4">
              <button
                onClick={handleCreate}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 custom-button"
              >
                Create
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
