"use client";
import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { db } from "../firebase"; // Import Firebase config
import { doc, setDoc, deleteDoc } from "firebase/firestore"; // Firestore methods
import "../globals.css";

export default function EditReviewers() {
  const [channelName, setChannelName] = useState("Edu bravasbarcelona");
  const [channelId, setChannelId] = useState("UCCLmgghh377dcvsOx6e9mGO");
  const [lastVideoChecked, setLastVideoChecked] = useState("n8-qoft.lypb0");
  const [avatarUrl, setAvatarUrl] = useState("https://y13.googleusercontent.com/y1c/Aldro_kw1LXpGr...");
  const [webUrl, setWebUrl] = useState("https://www.youtube.com/gbravasbarcelona");

  const handleUpdate = async () => {
    try {
      // Define the document reference
      const reviewerRef = doc(db, "reviewers", channelId); // Collection name 'reviewers', use 'channelId' as the doc ID

      // Update reviewer information in Firestore
      await setDoc(reviewerRef, {
        channelName,
        lastVideoChecked,
        avatarUrl,
        webUrl,
      }, { merge: true }); // Merge allows us to update only the fields we provide, without overwriting the whole document

      console.log("Reviewer updated successfully!");
    } catch (error) {
      console.error("Error updating reviewer:", error);
    }
  };

  const handleDelete = async () => {
    try {
      // Define the document reference
      const reviewerRef = doc(db, "reviewers", channelId); // Collection name 'reviewers', using 'channelId' as the doc ID

      // Delete the reviewer document from Firestore
      await deleteDoc(reviewerRef);

      console.log("Reviewer deleted successfully!");
    } catch (error) {
      console.error("Error deleting reviewer:", error);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Edit Reviewers</h1>
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
    </Layout>
  );
}
