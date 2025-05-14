"use client";
import Layout from "../components/Layout";
import ReactPaginate from "react-paginate";
import { useState, useEffect } from "react";
import { searchPlaces } from "../googlePlacesService";
import { getPlaceDetails } from "../googlePlacesService";

import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

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
    if (!formData.restaurantName.trim()) {
      window.alert("Please enter a restaurant name before searching.");
      return;
    }
  
    try {
      const results = await searchPlaces(formData.restaurantName);
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
    if (!formData.googlePlaceId) {
      console.warn("Google Place ID is missing. Skipping fetch.");
      return;
    }
  
    try {
      const details = await getPlaceDetails(formData.googlePlaceId); // Use the imported function
      console.log("Place details:", details);
  
      setFormData((prevData) => ({
        ...prevData,
        address: details.formattedAddress || "",
        phone: details.internationalPhoneNumber || "",
        website: details.websiteUri || "",
        googleMapsLink: details.googleMapsUri || "",
        googleMapsRating: details.rating || "",
        googleMapsReviewsCount: details.userRatingCount || "",
        priceLevel: details.priceLevel || "",
        restaurantImage: details.photos?.[0]?.googleUrl || "",
        restaurantStatus: details.businessStatus || "",
      }));
    } catch (error) {
      console.error("Failed to get place details:", error);
      alert("Failed to retrieve place details. Check the Place ID.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here (e.g., saving to the database or sending an API request)
    console.log("Form data submitted:", formData);
  };

  return (
    <Layout>
      <div className="layout-container p-6">
        <h1 className="text-center text-2xl font-bold mb-6">Edit Videos</h1>

        {/* Search bar */}
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

        {/* No results */}
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

        {/* Video card */}
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

        {/* Video embed (outside card) */}
        {currentPageData.map((video) => (
          video.videoId && (
            <div key={video.id} className="video-embed">
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
            onClick={() =>
              setformData([
                ...formData,
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
              ])
            }
          >
            + Add Another Review
          </button>
        </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
            <div className="form-group">
              <label htmlFor="restaurantName" className="block text-sm font-semibold mb-2">
                Restaurant Name
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="restaurantName"
                  name="restaurantName"
                  value={formData.restaurantName}
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
                        setFormData((prevData) => ({
                          ...prevData,
                          restaurantName: place.displayName?.text || place.name?.text || "",
                          googlePlaceId: place.id || ""
                        }));
                        setPlaceSuggestions([]); // close dropdown after selection
                      }}                      
                    >
                      {place.displayName?.text || place.name?.text || "Unknown Place"}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="restaurantName"
                  name="restaurantName"
                  value={formData.googlePlaceId}
                  onChange={handleInputChange}
                  className="custom-input"
                  placeholder="Enter GooglePlaceId"
                />
                <button
                  type="button"
                  onClick={handlePlaceDetailsFetch}
                  className="custom-button bg-blue-500 text-white"
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
                value={formData.address}
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
                value={formData.phone}
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
                value={formData.website}
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
                value={formData.tripAdvisorLink}
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
                value={formData.googleMapsLink}
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
                value={formData.googleMapsRating}
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
                value={formData.googleMapsReviewsCount}
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
                value={formData.priceLevel}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Enter price level"
              />
            </div>

            <div className="form-group">
              <label htmlFor="googleMapsLink" className="block text-sm font-semibold mb-2">
                Google Maps Location
              </label>
              {formData.googleMapsLink && (
                <iframe
                  className="w-full h-64 rounded-lg shadow-md"
                  src={formData.googleMapsLink}
                  allowFullScreen
                  loading="lazy"
                  title="Google Maps Location"
                ></iframe>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="restaurantImage" className="block text-sm font-semibold mb-2">
                Restaurant Image
              </label>
              <input
                type="text"
                id="restaurantImage"
                name="restaurantImage"
                value={formData.restaurantImage}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Enter restaurant image URL"
              />
            </div>

            <div className="form-group">
              <label htmlFor="restaurantStatus" className="block text-sm font-semibold mb-2">
                Restaurant Status
              </label>
              <input
                type="text"
                id="restaurantStatus"
                name="restaurantStatus"
                value={formData.restaurantStatus}
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
                value={formData.secondOfReview}
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
                value={formData.restaurantDescription}
                onChange={handleInputChange}
                className="custom-input"
                placeholder="Enter restaurant description"
                rows="3"
              ></textarea>
            </div>

            <button type="submit" className="custom-button bg-green-500 text-white w-full py-2 rounded-lg">
              Submit
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
