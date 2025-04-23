"use client";
import Layout from "../components/Layout";
import ReactPaginate from "react-paginate";
import { useState, useEffect } from "react";
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
          reviews: [], // Placeholder for reviews to be fetched from Google Places API
        };
      });

      // Fetch reviews for each video from Google Places
      const enrichedVideos = await Promise.all(
        videosList.map(async (video) => {
          const reviews = await fetchReviewsFromGooglePlaces(video.videoId); // Replace with actual identifier
          return {
            ...video,
            reviews, // Add reviews to each video
          };
        })
      );

      setVideos(enrichedVideos);
    };

    fetchVideosAndReviewers();
  }, []);

  const fetchReviewsFromGooglePlaces = async (videoId) => {
    try {
      const apiKey = "YOUR_GOOGLE_PLACES_API_KEY"; // Replace with your API key
      const placeId = "PLACE_ID_FOR_VIDEO"; // Replace with the appropriate place ID logic
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`
      );
      const data = await response.json();

      // Extract reviews from the response
      return data.result.reviews.map((review) => ({
        avatar: review.profile_photo_url,
        reviewerName: review.author_name,
        date: new Date(review.time * 1000).toLocaleDateString(), // Convert timestamp to date
        comment: review.text,
      }));
    } catch (error) {
      console.error("Failed to fetch reviews from Google Places", error);
      return [];
    }
  };

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  };

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  /* Form handling */
  const [formData, setFormData] = useState({
    restaurantName: "",
    googlePlaceId: "",
    address: "",
    phone: "",
    website: "",
    tripAdvisorLink: "",
    googleMapsLink: "",
    googleMapsRating: "",
    googleMapsReviewsCount: "",
    priceLevel: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here (e.g., saving to the database or sending an API request)
    console.log("Form data submitted:", formData);
  };

  return (
    <Layout>
      <div className="layout-container p-6">
        <h1 className="text-center">Edit Videos</h1>

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
          <p className="text-center">No videos found.</p>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div>
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
            {/* Avatar and channel info */}
            <img
              src={video.channelAvatar}
              alt="Channel avatar"
            />
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
          <h2 className="text-xl font-semibold text-center mb-4">Select a Review</h2>

          {currentPageData.map((video) => (
            <div key={video.id} className="wide-review-card bg-gray-100 rounded-xl shadow-md p-4 mx-auto max-w-4xl">
              <h3 className="text-lg font-bold mb-4">{video.title}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-4">
                  <label htmlFor="restaurantName" className="block text-sm font-semibold">Restaurant Name</label>
                  <input
                    type="text"
                    id="restaurantName"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter restaurant name"
                  />
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="googlePlaceId" className="block text-sm font-semibold">Google Place ID</label>
                  <input
                    type="text"
                    id="googlePlaceId"
                    name="googlePlaceId"
                    value={formData.googlePlaceId}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter Google Place ID"
                  />
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="address" className="block text-sm font-semibold">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter restaurant address"
                  />
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="phone" className="block text-sm font-semibold">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter restaurant phone"
                  />
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="website" className="block text-sm font-semibold">Website</label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter website URL"
                  />
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="tripAdvisorLink" className="block text-sm font-semibold">TripAdvisor Link</label>
                  <input
                    type="url"
                    id="tripAdvisorLink"
                    name="tripAdvisorLink"
                    value={formData.tripAdvisorLink}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter TripAdvisor link"
                  />
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="googleMapsLink" className="block text-sm font-semibold">Google Maps Link</label>
                  <input
                    type="url"
                    id="googleMapsLink"
                    name="googleMapsLink"
                    value={formData.googleMapsLink}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter Google Maps link"
                  />
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="googleMapsRating" className="block text-sm font-semibold">Google Maps Rating</label>
                  <input
                    type="number"
                    id="googleMapsRating"
                    name="googleMapsRating"
                    value={formData.googleMapsRating}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter Google Maps rating"
                  />
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="googleMapsReviewsCount" className="block text-sm font-semibold">Reviews Count</label>
                  <input
                    type="number"
                    id="googleMapsReviewsCount"
                    name="googleMapsReviewsCount"
                    value={formData.googleMapsReviewsCount}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter Google Maps reviews count"
                  />
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="priceLevel" className="block text-sm font-semibold">Price Level</label>
                  <input
                    type="number"
                    id="priceLevel"
                    name="priceLevel"
                    value={formData.priceLevel}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter price level"
                  />
                </div>

                <button type="submit" className="submit-button">Submit</button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
