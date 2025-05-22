"use client";
import Layout from "../components/Layout";
import ReactPaginate from "react-paginate";
import { useState, useEffect } from "react";
import { searchPlaces } from "../googlePlacesService";
import { getPlaceDetails } from "../googlePlacesService";

import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, getDoc, deleteDoc, addDoc, setDoc } from "firebase/firestore";
import MapComponent from "../components/MapComponent";
import "leaflet/dist/leaflet.css";

export default function EditVideos() {
  const [videos, setVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 1;

  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.ceil(filteredVideos.length / itemsPerPage);
  const currentPageData = filteredVideos.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  useEffect(() => {
    const fetchVideosAndReviewers = async () => {
      const videosSnapshot = await getDocs(collection(db, "VideosToEdit"));
      const reviewersSnapshot = await getDocs(collection(db, "Reviewers"));
      const reviewerMap = {};
      reviewersSnapshot.forEach((doc) => {
        reviewerMap[doc.id] = doc.data();
      });

      const videosList = videosSnapshot.docs.map((doc) => {
        const videoData = doc.data();
        const reviewer = reviewerMap[videoData.channelId] || {};
        return {
          id: doc.id,
          ...videoData,
          channelTitle: reviewer.channelName || "Desconocido",
          channelAvatar: reviewer.avatarUrl || "https://via.placeholder.com/48",
        };
      });

      setVideos(videosList);
    };

    fetchVideosAndReviewers();
  }, []);

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  };

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  /* Form handling */
  const [formData, setformData] = useState([
    {
      secondOfReview: "",
      restaurantDescription: "",
      googlePlaceId: "",
      restaurantName: "",
      address: "",
      phone: "",
      website: "",
      tripAdvisorLink: "",
      googleMapsLink: "",
      googleMapsRating: "",
      googleMapsReviewsCount: "",
      priceLevel: "",
      restaurantImage: "",
      restaurantStatus: ""
    }
  ]);  

  const handleSearchClick = async () => {
    const restaurantName = formData[activeReviewIndex]?.restaurantName?.trim();
    if (!restaurantName) {
      window.alert("Please enter a restaurant name before searching.");
      return;
    }
  
    try {
      const results = await searchPlaces(restaurantName);
      console.log("Search results:", results);
      setPlaceSuggestions(results);
    } catch (error) {
      console.error("Error fetching places:", error);
      setPlaceSuggestions([]);
    }
  };  

  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [placeSuggestions, setPlaceSuggestions] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setformData((prevList) => {
      const updatedList = [...prevList];
      updatedList[activeReviewIndex] = {
        ...updatedList[activeReviewIndex],
        [name]: value
      };
      return updatedList;
    });
  };  

  const handlePlaceDetailsFetch = async () => {
    const googlePlaceId = formData[activeReviewIndex]?.googlePlaceId?.trim();
    if (!googlePlaceId) {
      console.warn("Google Place ID is missing. Skipping fetch.");
      return;
    }
  
    try {
      const details = await getPlaceDetails(googlePlaceId); // Use the imported function
      console.log("Place details:", details);
  
      setformData((prevList) => {
        const updatedList = [...prevList];
        updatedList[activeReviewIndex] = {
          ...updatedList[activeReviewIndex],
          address: details.formattedAddress || "",
          phone: details.internationalPhoneNumber || "",
          website: details.websiteUri || "",
          googleMapsLink: details.googleMapsUri || "",
          googleMapsRating: details.rating || "",
          googleMapsReviewsCount: details.userRatingCount || "",
          priceLevel: details.priceLevel || "",
          restaurantImage: details.photos?.[0]?.googleUrl || "",
          restaurantStatus: details.businessStatus || "",
        };
        return updatedList;
      });
    } catch (error) {
      console.error("Failed to get place details:", error);
      alert("Failed to retrieve place details. Check the Place ID.");
    }
  };

  const handleSaveToFirebase = async () => {
    try {
      const selectedVideoId = currentPageData[0]?.videoId; // Dynamically get the video ID from the current page data
      if (!selectedVideoId) {
        alert("No video ID found. Please ensure a video is selected.");
        return;
      }
  
      const videoRef = doc(db, "VideosToEdit", selectedVideoId);
  
      // Fetch existing reviews from Firestore
      const videoSnapshot = await getDoc(videoRef);
      let existingReviews = [];
      if (videoSnapshot.exists() && videoSnapshot.data().reviews) {
        existingReviews = videoSnapshot.data().reviews;
      }
  
      // Merge existing reviews with new reviews, ensuring restaurantName and googlePlaceId are included
      const updatedReviews = [
        ...existingReviews,
        ...formData.map((review) => ({
          ...review,
          restaurantName: review.restaurantName || "Unknown Restaurant", // Default value if empty
          googlePlaceId: review.googlePlaceId || "Unknown Place ID" // Default value if empty
        }))
      ];
  
      // Save the merged reviews array to Firestore
      await updateDoc(videoRef, {
        reviews: updatedReviews
      });
  
      alert("Data saved successfully to Firebase!");
    } catch (error) {
      console.error("Error saving data to Firebase:", error);
      alert("Failed to save data to Firebase.");
    }
  };

  const handleRemoveVideo = async () => {
    try {
      const selectedVideoId = currentPageData[0]?.videoId; // Dynamically get the video ID from the current page data
      if (!selectedVideoId) {
        alert("No video ID found. Please ensure a video is selected.");
        return;
      }
  
      const videoRef = doc(db, "VideosToEdit", selectedVideoId);
  
      // Delete the video from Firebase
      await deleteDoc(videoRef);
  
      // Remove the video from the local state
      setVideos((prevVideos) => prevVideos.filter((video) => video.videoId !== selectedVideoId));
  
      // Display the next review or reset if no reviews are left
      if (currentPageData.length > 1) {
        setCurrentPage(0); // Reset to the first page
      } else {
        setformData([]); // Clear formData if no reviews are left
        alert("No more reviews available.");
      }
  
      alert("Video removed successfully!");
    } catch (error) {
      console.error("Error removing video from Firebase:", error);
      alert("Failed to remove video. Please try again.");
    }
  };

  const handleSaveToRestaurants = async () => {
    try {
      const selectedVideoId = currentPageData[0]?.videoId; // Dynamically get the video ID from the current page data
      const selectedVideoTitle = currentPageData[0]?.title; // Get the video title
      if (!selectedVideoId) {
        alert("No video ID found. Please ensure a video is selected.");
        return;
      }
  
      // Prepare the restaurant data
      const restaurantsCollectionRef = collection(db, "Restaurants");
      for (const restaurant of formData) {
        if (!restaurant.googlePlaceId) {
          console.warn("Skipping restaurant without a googlePlaceId:", restaurant);
          continue; // Skip restaurants without a googlePlaceId
        }
  
        const restaurantRef = doc(restaurantsCollectionRef, restaurant.googlePlaceId);
  
        // Merge the video information into the restaurant document
        await setDoc(
          restaurantRef,
          {
            ...restaurant,
            videos: {
              [selectedVideoId]: {
                videoId: selectedVideoId,
                title: selectedVideoTitle,
              },
            },
          },
          { merge: true } // Merge with existing data if the document already exists
        );
      }
  
      alert("Restaurants saved successfully to Firebase!");
    } catch (error) {
      console.error("Error saving restaurants to Firebase:", error);
      alert("Failed to save restaurants. Please try again.");
    }
  };
  
  useEffect(() => {
    const selectedVideoId = currentPageData[0]?.videoId;
    if (selectedVideoId) {
      const loadFullReviewList = async () => {
        try {
          const videoRef = doc(db, "VideosToEdit", selectedVideoId);
          const videoSnapshot = await getDoc(videoRef);
  
          if (videoSnapshot.exists()) {
            const videoData = videoSnapshot.data();
            if (Array.isArray(videoData.reviews) && videoData.reviews.length > 0) {
              setformData(videoData.reviews); // Populate formData with the reviews array
              setActiveReviewIndex(0); // Reset to the first review
            } else {
              console.warn("No reviews found for this video. Initializing with a default review.");
              setformData([
                {
                  secondOfReview: "",
                  restaurantDescription: "",
                  googlePlaceId: "",
                  restaurantName: "",
                  address: "",
                  phone: "",
                  website: "",
                  tripAdvisorLink: "",
                  googleMapsLink: "",
                  googleMapsRating: "",
                  googleMapsReviewsCount: "",
                  priceLevel: "",
                  restaurantImage: "",
                  restaurantStatus: ""
                }
              ]);
              setActiveReviewIndex(0); // Reset to the first review
            }
          } else {
            console.warn("Video not found. Initializing with a default review.");
            setformData([
              {
                secondOfReview: "",
                restaurantDescription: "",
                googlePlaceId: "",
                restaurantName: "",
                address: "",
                phone: "",
                website: "",
                tripAdvisorLink: "",
                googleMapsLink: "",
                googleMapsRating: "",
                googleMapsReviewsCount: "",
                priceLevel: "",
                restaurantImage: "",
                restaurantStatus: ""
              }
            ]);
            setActiveReviewIndex(0); // Reset to the first review
          }
        } catch (err) {
          console.error("Failed to load video data:", err);
        }
      };
  
      loadFullReviewList();
    }
  }, [currentPageData[0]?.videoId]); // Only when video changes
  

  return (
    <Layout>
      <div className="layout-container p-6">
        <h1 className="text-center text-2xl font-bold mb-6">Edit Videos</h1>

        {/* Search Bar */}
        <div className="card-container">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={handleSearchTermChange}
            className="custom-input"
          />
          {searchTerm && (
            <button className="custom-button ml-3 mt-4" onClick={() => setSearchTerm("")}>
              &#10005; Clear
            </button>
          )}
        </div>

        {/* No Results */}
        {filteredVideos.length === 0 && (
          <p className="text-center text-gray-500 mt-4">No videos found.</p>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="mt-4">
            <ReactPaginate
              previousLabel={"Previous"}
              nextLabel={"Next"}
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

        {/* Video Card */}
        {currentPageData.map((video) => (
          <div key={video.id} className="reviewer-card mt-4">
            <img src={video.channelAvatar} alt="Channel avatar" />
            <div>
              <h2>{video.channelTitle}</h2>
              <a
                href={`https://www.youtube.com/channel/${video.channelId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500"
              >
                View Channel
              </a>
              <p className="mt-4">
                <strong>Title:</strong> {video.title}
              </p>
              <p>
                <strong>Publication date:</strong>{" "}
                {new Date(video.publishedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}

        {/* Video Embed */}
        {currentPageData.map((video) => (
          video.videoId && (
            <div key={video.id} className="video-embed mt-6">
              <iframe
                className="w-full"
                style={{ aspectRatio: "16/9" }}
                src={`https://www.youtube.com/embed/${video.videoId}`}
                title={video.title}
                allowFullScreen
              ></iframe>
            </div>
          )
        ))}

        {/* Reviews Section */}
        <div className="reviews-section mt-6">
          <h2 className="text-xl font-semibold text-center mb-6">Restaurant Details</h2>
          <div className="flex flex-wrap gap-4 justify-center items-center mt-6">
            <button
              type="button"
              className="custom-button"
              disabled={activeReviewIndex === 0}
              onClick={() => setActiveReviewIndex(activeReviewIndex - 1)}
            >
              Previous Review
            </button>

            <span>
              Review {activeReviewIndex + 1} of {formData.length}
            </span>

            <button
              type="button"
              className="custom-button"
              disabled={activeReviewIndex === formData.length - 1}
              onClick={() => setActiveReviewIndex(activeReviewIndex + 1)}
            >
              Next Review
            </button>

            <button
              type="button"
              className="custom-button"
              onClick={() => {
                setformData((prevFormData) => {
                  const newFormData = [
                    ...prevFormData,
                    {
                      secondOfReview: "",
                      restaurantDescription: "",
                      googlePlaceId: "",
                      restaurantName: "",
                      address: "",
                      phone: "",
                      website: "",
                      tripAdvisorLink: "",
                      googleMapsLink: "",
                      googleMapsRating: "",
                      googleMapsReviewsCount: "",
                      priceLevel: "",
                      restaurantImage: "",
                      restaurantStatus: ""
                    }
                  ];
                  setActiveReviewIndex(newFormData.length - 1); // Set index to the newly added item
                  return newFormData;
                });
              }}            
            >
              + Add Another Review
            </button>
          </div>

          <form onSubmit={handleSaveToFirebase} className="space-y-6 max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
            <div className="form-group">
              <label htmlFor="restaurantName" className="block text-sm font-semibold mb-2">
                Restaurant Name
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="restaurantName"
                  name="restaurantName"
                  value={formData[activeReviewIndex]?.restaurantName || ""}
                  onChange={handleInputChange}
                  className="custom-input"
                  placeholder="Enter restaurant name"
                />
                <button
                  type="button"
                  onClick={handleSearchClick}
                  className="custom-button bg-blue-500 text-white"
                >
                  Search
                </button>
              </div>
              {placeSuggestions.length > 0 && (
                <ul className="dropdown bg-white border rounded shadow-md mt-2">
                  {placeSuggestions.map((place, index) => (
                    <li
                      key={index}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setformData((prevList) => {
                          const updatedList = [...prevList];
                          updatedList[activeReviewIndex] = {
                            ...updatedList[activeReviewIndex],
                            restaurantName: place.displayName?.text || place.name?.text || "",
                            googlePlaceId: place.id || ""
                          };
                          return updatedList;
                        });
                        setPlaceSuggestions([]); // close dropdown after selection
                      }}                      
                    >
                      {place.displayName?.text || place.name?.text || "Unknown Place"}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="googlePlaceId" className="block text-sm font-semibold mb-2">
                Google Place ID
              </label>
              <input
                type="text"
                id="googlePlaceId"
                name="googlePlaceId"
                value={formData[activeReviewIndex]?.googlePlaceId || ""}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Google Place ID will autocomplete"
              />
              <button
                type="button"
                onClick={handlePlaceDetailsFetch}
                className="custom-button bg-blue-500 text-white mt-2"
              >
                Fetch Details
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="address" className="block text-sm font-semibold mb-2">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData[activeReviewIndex]?.address || ""}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Enter restaurant address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="block text-sm font-semibold mb-2">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData[activeReviewIndex]?.phone || ""}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Enter restaurant phone"
              />
            </div>

            <div className="form-group">
              <label htmlFor="website" className="block text-sm font-semibold mb-2">
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData[activeReviewIndex]?.website || ""}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Enter website URL"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tripAdvisorLink" className="block text-sm font-semibold mb-2">
                TripAdvisor Link
              </label>
              <input
                type="url"
                id="tripAdvisorLink"
                name="tripAdvisorLink"
                value={formData[activeReviewIndex]?.tripAdvisorLink || ""}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Enter TripAdvisor link"
              />
            </div>

            <div className="form-group">
              <label htmlFor="googleMapsLink" className="block text-sm font-semibold mb-2">
                Google Maps Link
              </label>
              <input
                type="url"
                id="googleMapsLink"
                name="googleMapsLink"
                value={formData[activeReviewIndex]?.googleMapsLink || ""}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Enter Google Maps link"
              />
            </div>

            <div className="form-group">
              <label htmlFor="googleMapsRating" className="block text-sm font-semibold mb-2">
                Google Maps Rating
              </label>
              <input
                type="number"
                id="googleMapsRating"
                name="googleMapsRating"
                value={formData[activeReviewIndex]?.googleMapsRating || ""}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Enter Google Maps rating"
              />
            </div>

            <div className="form-group">
              <label htmlFor="googleMapsReviewsCount" className="block text-sm font-semibold mb-2">
                Google Maps Reviews Count
              </label>
              <input
                type="number"
                id="googleMapsReviewsCount"
                name="googleMapsReviewsCount"
                value={formData[activeReviewIndex]?.googleMapsReviewsCount || ""}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Enter Google Maps reviews count"
              />
            </div>

            <div className="form-group">
              <label htmlFor="priceLevel" className="block text-sm font-semibold mb-2">
                Price Level
              </label>
              <input
                type="number"
                id="priceLevel"
                name="priceLevel"
                value={formData[activeReviewIndex]?.priceLevel || ""}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Enter price level"
              />
            </div>

            <MapComponent location={formData[activeReviewIndex]?.location} />

            <div className="form-group">
              <label htmlFor="restaurantImage" className="block text-sm font-semibold mb-2">
                Restaurant Image
              </label>
              <input
                type="text"
                id="restaurantImage"
                name="restaurantImage"
                value={formData[activeReviewIndex]?.restaurantImage || ""}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Enter restaurant image URL"
              />
              {formData[activeReviewIndex]?.restaurantImage ? (
                <img
                  src={formData[activeReviewIndex]?.restaurantImage}
                  alt="Restaurant"
                  className="mt-4 w-full h-auto rounded-lg shadow-md"
                  onError={(e) => {
                    e.target.src = "/placeholder-image.jpg"; // Fallback image
                    e.target.alt = "Placeholder Image";
                  }}
                />
              ) : (
                <p className="text-gray-500 mt-4">No image available.</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="restaurantStatus" className="block text-sm font-semibold mb-2">
                Restaurant Status
              </label>
              <input
                type="text"
                id="restaurantStatus"
                name="restaurantStatus"
                value={formData[activeReviewIndex]?.restaurantStatus || ""}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Enter restaurant status"
              />
            </div>

            <div className="form-group">
              <label htmlFor="secondOfReview" className="block text-sm font-semibold mb-2">
                Second of the Review
              </label>
              <input
                type="text"
                id="secondOfReview"
                name="secondOfReview"
                value={formData[activeReviewIndex]?.secondOfReview || ""}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Enter second when the review begins"
              />
            </div>

            <div className="form-group">
              <label htmlFor="restaurantDescription" className="block text-sm font-semibold mb-2">
                Restaurant Description
              </label>
              <textarea
                id="restaurantDescription"
                name="restaurantDescription"
                value={formData[activeReviewIndex]?.restaurantDescription || ""}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Enter restaurant description"
                rows="3"
              ></textarea>
            </div>

            <button
              type="button"
              className="custom-button bg-blue-500 text-white w-full py-2 rounded-lg mt-4"
              onClick={handleSaveToFirebase}
            >
              Save to Firebase
            </button>

            <button
              type="button"
              className="custom-button bg-red-500 text-white w-full py-2 rounded-lg mt-6"
              onClick={async () => {
                const confirmDelete = window.confirm("Are you sure you want to delete this video?");
                if (confirmDelete) {
                  await handleRemoveVideo();
                }
              }}
            >
              Remove Video
            </button>

            <button
              type="button"
              className="custom-button bg-green-500 text-white w-full py-2 rounded-lg mt-6"
              onClick={handleSaveToRestaurants}
            >
              Save Restaurant to Firebase
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
