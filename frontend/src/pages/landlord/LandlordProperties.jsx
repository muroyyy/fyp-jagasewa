import React, { useState } from 'react';
import { Home, Building2, Users, DollarSign, Wrench, Bell, Settings, LogOut, Menu, X, MapPin, Plus, Search, Filter } from 'lucide-react';
import { logout } from '../../utils/auth';

export default function LandlordProperties() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3 ml-2 lg:ml-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  JagaSewa
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-900">Max Verstappen</p>
                  <p className="text-xs text-gray-500">Landlord Account</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">M</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full pt-20">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            <a href="/landlord-dashboard" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </a>
            <a href="/landlord/properties" className="flex items-center space-x-3 px-4 py-3 text-blue-600 bg-blue-50 rounded-lg font-medium">
              <Building2 className="w-5 h-5" />
              <span>Properties</span>
            </a>
            <a href="/landlord/tenants" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Users className="w-5 h-5" />
              <span>Tenants</span>
            </a>
            <a href="/landlord/payments" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <DollarSign className="w-5 h-5" />
              <span>Payments</span>
            </a>
            <a href="/landlord/maintenance" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Wrench className="w-5 h-5" />
              <span>Maintenance</span>
            </a>
            <a href="/landlord/settings" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </a>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg font-medium cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16">
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

          {/* Empty State */}
          {filteredProperties.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or add a new property</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}