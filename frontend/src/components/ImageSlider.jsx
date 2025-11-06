import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

export default function ImageSlider({ images, propertyName, className = "h-48" }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={`${className} bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center`}>
        <Building2 className="w-20 h-20 text-blue-300" />
      </div>
    );
  }

  const getImageUrl = (image) => {
    return image.startsWith('https://') ? image : `${API_BASE_URL}/../${image}`;
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index) => {
    setCurrentIndex(index);
  };

  if (images.length === 1) {
    return (
      <div className={`${className} relative overflow-hidden`}>
        <img 
          src={getImageUrl(images[0])} 
          alt={propertyName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden group`}>
      {/* Main Image */}
      <img 
        src={getImageUrl(images[currentIndex])} 
        alt={`${propertyName} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Navigation Arrows */}
      <button
        onClick={prevImage}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <button
        onClick={nextImage}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70 cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
              index === currentIndex 
                ? 'bg-white' 
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
          />
        ))}
      </div>

      {/* Image Counter */}
      <div className="absolute top-3 right-3 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded-full">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}