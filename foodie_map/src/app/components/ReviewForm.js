import React, { useState } from 'react';

const ReviewForm = ({ review }) => {
  const [formData, setFormData] = useState({
    restaurantName: review.restaurantName || '',
    googlePlaceId: review.googlePlaceId || '',
    address: review.address || '',
    phone: review.phone || '',
    website: review.website || '',
    tripAdvisorLink: review.tripAdvisorLink || '',
    googleMapsLink: review.googleMapsLink || '',
    googleMapsRating: review.googleMapsRating || '',
    googleMapsReviewsCount: review.googleMapsReviewsCount || '',
    priceLevel: review.priceLevel || ''
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
    <div className="review-card bg-gray-100 rounded-xl shadow-md p-4 mx-auto max-w-4xl">
      <h3 className="text-lg font-bold mb-4">{review.restaurantName} - Edit Review</h3>

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
            placeholder="Enter Google Maps Rating"
          />
        </div>

        <div className="form-group mb-4">
          <label htmlFor="googleMapsReviewsCount" className="block text-sm font-semibold">Google Maps Reviews Count</label>
          <input
            type="number"
            id="googleMapsReviewsCount"
            name="googleMapsReviewsCount"
            value={formData.googleMapsReviewsCount}
            onChange={handleInputChange}
            className="input-field"
            placeholder="Enter review count"
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

        <button type="submit" className="btn-submit">Save Changes</button>
      </form>
    </div>
  );
};

export default ReviewForm;
