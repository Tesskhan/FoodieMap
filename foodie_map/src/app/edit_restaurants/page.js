"use client";
import Layout from "../components/Layout";
import ReactPaginate from "react-paginate";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { searchPlaces, getPlaceDetails } from "../googlePlacesService";

export default function EditRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 1;

  const filteredRestaurants = restaurants.filter((r) =>
    r.restaurantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.ceil(filteredRestaurants.length / itemsPerPage);
  const currentPageData = filteredRestaurants.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const restaurantsSnapshot = await getDocs(collection(db, "Restaurants"));
        const restaurantsList = restaurantsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRestaurants(restaurantsList);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      }
    };

    fetchRestaurants();
  }, []);

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  };

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  const handleInputChange = (e, restaurantId) => {
    const { name, value } = e.target;
    setRestaurants((prevRestaurants) =>
      prevRestaurants.map((restaurant) =>
        restaurant.id === restaurantId
          ? { ...restaurant, [name]: value }
          : restaurant
      )
    );
  };

  const handleUpdateRestaurant = async (restaurantId) => {
    try {
      const restaurant = restaurants.find((r) => r.id === restaurantId);
      const restaurantRef = doc(db, "Restaurants", restaurantId);
      await setDoc(restaurantRef, restaurant, { merge: true });
      alert("Restaurant updated successfully!");
    } catch (error) {
      console.error("Error updating restaurant:", error);
      alert("Failed to update restaurant. Please try again.");
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    try {
      const restaurantRef = doc(db, "Restaurants", restaurantId);
      await deleteDoc(restaurantRef);
      setRestaurants((prevRestaurants) =>
        prevRestaurants.filter((r) => r.id !== restaurantId)
      );
      alert("Restaurant deleted successfully!");
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      alert("Failed to delete restaurant. Please try again.");
    }
  };

  const handleSearchPlaces = async (restaurantId) => {
    const restaurant = restaurants.find((r) => r.id === restaurantId);
    if (!restaurant.restaurantName.trim()) {
      alert("Please enter a restaurant name before searching.");
      return;
    }

    try {
      const results = await searchPlaces(restaurant.restaurantName);
      if (results.length > 0) {
        const selectedPlace = results[0]; // Automatically select the first result
        handlePlaceDetailsFetch(restaurantId, selectedPlace.id);
      } else {
        alert("No places found for the given restaurant name.");
      }
    } catch (error) {
      console.error("Error searching places:", error);
      alert("Failed to search places. Please try again.");
    }
  };

  const handlePlaceDetailsFetch = async (restaurantId, placeId) => {
    if (!placeId) {
      alert("Place ID is required to fetch details.");
      return;
    }

    try {
      const details = await getPlaceDetails(placeId);
      setRestaurants((prevRestaurants) =>
        prevRestaurants.map((restaurant) =>
          restaurant.id === restaurantId
            ? {
                ...restaurant,
                googlePlaceId: placeId,
                address: details.formattedAddress || "",
                phone: details.internationalPhoneNumber || "",
                website: details.websiteUri || "",
                googleMapsLink: details.googleMapsUri || "",
                googleMapsRating: details.rating || "",
                googleMapsReviewsCount: details.userRatingCount || "",
                priceLevel: details.priceLevel || "",
                restaurantImage: details.photos?.[0]?.googleUrl || "",
                restaurantStatus: details.businessStatus || "",
              }
            : restaurant
        )
      );
      alert("Place details fetched successfully!");
    } catch (error) {
      console.error("Error fetching place details:", error);
      alert("Failed to fetch place details. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="layout-container p-6">
        <h1 className="text-center text-2xl font-bold mb-6">Edit Restaurants</h1>

        {/* Search Bar */}
        <div className="card-container">
          <input
            type="text"
            placeholder="Search by restaurant name..."
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
        {filteredRestaurants.length === 0 && (
          <p className="text-center text-gray-500 mt-4">No restaurants found.</p>
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

        {/* Restaurant Card */}
        {currentPageData.map((restaurant) => (
          <div key={restaurant.id} className="restaurant-card mt-4 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Edit Restaurant</h2>

            {/* Update Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateRestaurant(restaurant.id);
              }}
              className="space-y-6"
            >
              <div className="form-group">
                <label htmlFor="restaurantName" className="block text-sm font-semibold mb-2">
                  Restaurant Name
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="restaurantName"
                    name="restaurantName"
                    value={restaurant.restaurantName || ""}
                    onChange={(e) => handleInputChange(e, restaurant.id)}
                    className="custom-input"
                    placeholder="Enter restaurant name"
                  />
                  <button
                    type="button"
                    onClick={() => handleSearchPlaces(restaurant.id)}
                    className="custom-button bg-blue-500 text-white"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="googlePlaceId" className="block text-sm font-semibold mb-2">
                  Google Place ID
                </label>
                <input
                  type="text"
                  id="googlePlaceId"
                  name="googlePlaceId"
                  value={restaurant.googlePlaceId || ""}
                  onChange={(e) => handleInputChange(e, restaurant.id)}
                  className="custom-input"
                  placeholder="Google Place ID will autocomplete"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address" className="block text-sm font-semibold mb-2">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={restaurant.address || ""}
                  onChange={(e) => handleInputChange(e, restaurant.id)}
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
                  value={restaurant.phone || ""}
                  onChange={(e) => handleInputChange(e, restaurant.id)}
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
                  value={restaurant.website || ""}
                  onChange={(e) => handleInputChange(e, restaurant.id)}
                  className="custom-input"
                  placeholder="Enter website URL"
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
                  value={restaurant.googleMapsRating || ""}
                  onChange={(e) => handleInputChange(e, restaurant.id)}
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
                  value={restaurant.googleMapsReviewsCount || ""}
                  onChange={(e) => handleInputChange(e, restaurant.id)}
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
                  value={restaurant.priceLevel || ""}
                  onChange={(e) => handleInputChange(e, restaurant.id)}
                  className="custom-input"
                  placeholder="Enter price level"
                />
              </div>

              <div className="form-group">
                <label htmlFor="restaurantImage" className="block text-sm font-semibold mb-2">
                  Restaurant Image
                </label>
                <input
                  type="text"
                  id="restaurantImage"
                  name="restaurantImage"
                  value={restaurant.restaurantImage || ""}
                  onChange={(e) => handleInputChange(e, restaurant.id)}
                  className="custom-input"
                  placeholder="Enter restaurant image URL"
                />
                {restaurant.restaurantImage && (
                  <img
                    src={restaurant.restaurantImage}
                    alt="Restaurant"
                    className="mt-4 w-full h-auto rounded-lg shadow-md"
                  />
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
                  value={restaurant.restaurantStatus || ""}
                  onChange={(e) => handleInputChange(e, restaurant.id)}
                  className="custom-input"
                  placeholder="Enter restaurant status"
                />
              </div>

              <button
                type="submit"
                className="custom-button bg-blue-500 text-white w-full py-2 rounded-lg mt-4"
              >
                Update Restaurant
              </button>
            </form>

            {/* Delete Button */}
            <button
              type="button"
              className="custom-button bg-red-500 text-white w-full py-2 rounded-lg mt-6"
              onClick={() => handleDeleteRestaurant(restaurant.id)}
            >
              Delete Restaurant
            </button>

            {/* Videos Associated with the Restaurant */}
            {restaurant.videos && Object.keys(restaurant.videos).length > 0 ? (
              <div className="videos-section mt-4">
                <h3 className="text-lg font-semibold">Videos:</h3>
                {Object.values(restaurant.videos).map((video, index) => (
                  <div key={index} className="video-card mt-2">
                    <p>
                      <strong>Title:</strong> {video.title}
                    </p>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500"
                    >
                      Watch Video
                    </a>
                    <div className="video-embed mt-2">
                      <iframe
                        className="w-full"
                        style={{ aspectRatio: "16/9" }}
                        src={`https://www.youtube.com/embed/${video.videoId}`}
                        title={video.title}
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mt-4">No videos available for this restaurant.</p>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}