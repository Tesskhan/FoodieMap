"use client";
import Layout from "../components/Layout";
import ReactPaginate from "react-paginate";
import { useState, useEffect } from "react";
import { db } from "../firebase"; // Import Firebase config
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore"; // Firestore methods
import "../globals.css";

export default function EditReviewers() {
  const [reviewers, setReviewers] = useState([]); // All reviewers
  const [showCreateForm, setShowCreateForm] = useState(false); // Toggle create form

  // State for new reviewer creation
  const [newReviewer, setNewReviewer] = useState({
    channelName: "",
    lastVideoChecked: "",
    avatarUrl: "",
    webUrl: "",
    channelId: "",
  });

  // Pagination state (0-indexed for ReactPaginate)
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 1; // ONE card per page
  const pageCount = Math.ceil(reviewers.length / itemsPerPage);
  const currentPageData = reviewers.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Fetch reviewers from Firestore
  useEffect(() => {
    const fetchReviewers = async () => {
      const querySnapshot = await getDocs(collection(db, "reviewers"));
      const reviewersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReviewers(reviewersList);
    };
    fetchReviewers();
  }, []);

  // Handle page change
  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  // Update local reviewer value when an input changes
  const updateLocalReviewerValue = (id, field, value) => {
    setReviewers((prevReviewers) =>
      prevReviewers.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  // Update a reviewer in Firebase
  const handleUpdate = async (id) => {
    const reviewer = reviewers.find((r) => r.id === id);
    try {
      const reviewerRef = doc(db, "reviewers", id);
      await setDoc(
        reviewerRef,
        {
          channelName: reviewer.channelName,
          lastVideoChecked: reviewer.lastVideoChecked,
          avatarUrl: reviewer.avatarUrl,
          webUrl: reviewer.webUrl,
        },
        { merge: true }
      );
      console.log("Reviewer updated successfully!");
    } catch (error) {
      console.error("Error updating reviewer:", error);
    }
  };

  // Delete a reviewer from Firebase
  const handleDelete = async (id) => {
    try {
      const reviewerRef = doc(db, "reviewers", id);
      await deleteDoc(reviewerRef);
      setReviewers((prevReviewers) =>
        prevReviewers.filter((r) => r.id !== id)
      );
      console.log("Reviewer deleted successfully!");
    } catch (error) {
      console.error("Error deleting reviewer:", error);
    }
  };

  // Create a new reviewer in Firebase
  const handleCreate = async () => {
    try {
      const newReviewerRef = doc(collection(db, "reviewers"));
      await setDoc(newReviewerRef, {
        channelName: newReviewer.channelName,
        lastVideoChecked: newReviewer.lastVideoChecked,
        avatarUrl: newReviewer.avatarUrl,
        webUrl: newReviewer.webUrl,
        channelId: newReviewer.channelId,
      });
      console.log("Reviewer created successfully!");
      setNewReviewer({
        channelName: "",
        lastVideoChecked: "",
        avatarUrl: "",
        webUrl: "",
        channelId: "",
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

        {/* Pagination Links at the Top */}
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

        {/* Reviewer Card (one per page) */}
        <div className="card-container mt-6 flex flex-col items-center justify-center">
          {currentPageData.map((reviewer) => (
            <div key={reviewer.id} className="reviewer-card p-4 border rounded-lg shadow-md flex flex-col items-center justify-center">
              <div className="space-y-4 w-full">
                <div className="text-center">
                  <img
                    src={reviewer.avatarUrl}
                    alt={reviewer.channelName}
                    className="w-16 h-16 rounded-full mx-auto"
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">Channel Name</label>
                  <input
                    type="text"
                    value={reviewer.channelName || ""}
                    onChange={(e) =>
                      updateLocalReviewerValue(reviewer.id, "channelName", e.target.value)
                    }
                    className="custom-input"
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">Last Video Checked</label>
                  <input
                    type="text"
                    value={reviewer.lastVideoChecked || ""}
                    onChange={(e) =>
                      updateLocalReviewerValue(reviewer.id, "lastVideoChecked", e.target.value)
                    }
                    className="custom-input"
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">Web URL</label>
                  <input
                    type="text"
                    value={reviewer.webUrl || ""}
                    onChange={(e) =>
                      updateLocalReviewerValue(reviewer.id, "webUrl", e.target.value)
                    }
                    className="custom-input"
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">Avatar URL</label>
                  <input
                    type="text"
                    value={reviewer.avatarUrl || ""}
                    onChange={(e) =>
                      updateLocalReviewerValue(reviewer.id, "avatarUrl", e.target.value)
                    }
                    className="custom-input"
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">Channel ID</label>
                  <input
                    type="text"
                    value={reviewer.id}
                    disabled
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
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Reviewer Button */}
        <div className="mt-6">
          <button
            onClick={() => setShowCreateForm(true)}
            className="custom-button bg-green-600 hover:bg-green-700"
          >
            Create Reviewer
          </button>
        </div>

        {/* Form for Creating Reviewer */}
        {showCreateForm && (
          <div className="mt-6 card-container flex flex-col items-center justify-center">
            <div className="p-6 border rounded-lg shadow-md bg-white w-full">
              <h2 className="text-xl font-bold mb-4">Create New Reviewer</h2>
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">Avatar URL</label>
                  <input
                    type="text"
                    value={newReviewer.avatarUrl}
                    onChange={(e) =>
                      setNewReviewer({ ...newReviewer, avatarUrl: e.target.value })
                    }
                    className="custom-input"
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">Last Video Checked</label>
                  <input
                    type="text"
                    value={newReviewer.lastVideoChecked}
                    onChange={(e) =>
                      setNewReviewer({ ...newReviewer, lastVideoChecked: e.target.value })
                    }
                    className="custom-input"
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">Channel Name</label>
                  <input
                    type="text"
                    value={newReviewer.channelName}
                    onChange={(e) =>
                      setNewReviewer({ ...newReviewer, channelName: e.target.value })
                    }
                    className="custom-input"
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">Web URL</label>
                  <input
                    type="text"
                    value={newReviewer.webUrl}
                    onChange={(e) =>
                      setNewReviewer({ ...newReviewer, webUrl: e.target.value })
                    }
                    className="custom-input"
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700">Channel ID</label>
                  <input
                    type="text"
                    value={newReviewer.channelId}
                    onChange={(e) =>
                      setNewReviewer({ ...newReviewer, channelId: e.target.value })
                    }
                    className="custom-input"
                  />
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
