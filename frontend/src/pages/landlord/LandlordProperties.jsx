import React, { useState } from 'react';
import { Building2, MapPin, Plus, Search } from 'lucide-react';
import LandlordLayout from '../../components/LandlordLayout';

export default function LandlordProperties() {
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy property data
  const properties = [
    {
      id: 1,
      name: 'Sunset Apartments',
      address: '123 Jalan Merdeka, Kuala Lumpur',
      type: 'Apartment',
      units: 12,
      occupied: 10,
      monthlyRent: 1500,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400'
    },
    {
      id: 2,
      name: 'Marina Bay Condos',
      address: '45 Persiaran Sultan, Petaling Jaya',
      type: 'Condominium',
      units: 8,
      occupied: 8,
      monthlyRent: 2200,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400'
    },
    {
      id: 3,
      name: 'Green Valley Villas',
      address: '78 Jalan Hijau, Subang Jaya',
      type: 'Villa',
      units: 5,
      occupied: 3,
      monthlyRent: 3500,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'
    }
  ];

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LandlordLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Properties</h1>
          <p className="text-gray-600">Manage and view all your properties</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer">
            <Plus className="w-5 h-5" />
            <span>Add Property</span>
          </button>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <div key={property.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-48 bg-gray-200">
                  <img 
                    src={property.image} 
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                      {property.status}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{property.name}</h3>
                  
                  <div className="flex items-start space-x-2 text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                    <p className="text-sm">{property.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="text-sm font-semibold text-gray-900">{property.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Units</p>
                      <p className="text-sm font-semibold text-gray-900">{property.units}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Occupied</p>
                      <p className="text-sm font-semibold text-gray-900">{property.occupied}/{property.units}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Monthly Rent</p>
                      <p className="text-sm font-semibold text-gray-900">RM {property.monthlyRent}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors cursor-pointer">
                      View Details
                    </button>
                    <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or add a new property</p>
          </div>
        )}
      </div>
    </LandlordLayout>
  );
}