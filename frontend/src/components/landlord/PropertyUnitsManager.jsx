import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Plus, MapPin, DollarSign, Home, User, Calendar } from 'lucide-react';

const PropertyUnitsManager = ({ property, onBack }) => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingUnit, setAddingUnit] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showBuildingStructure, setShowBuildingStructure] = useState(false);
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [buildingStructure, setBuildingStructure] = useState('');
  const [newUnit, setNewUnit] = useState({
    block: '',
    level: '',
    room_number: '',
    unit_type: '',
    custom_unit_type: '',
    size_sqft: '',
    monthly_rent: property.monthly_rent || '',
    status: 'available',
    description: ''
  });

  useEffect(() => {
    fetchUnits();
  }, [property.property_id]);

  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/property-units.php?property_id=${property.property_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUnits(data.data.units);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnitClick = () => {
    if ((property.property_type === 'Apartment' || property.property_type === 'Condominium') && !property.building_structure) {
      setShowBuildingStructure(true);
    } else {
      setShowAddUnit(true);
    }
  };

  const handleBuildingStructureSelect = (structure) => {
    setBuildingStructure(structure);
    setShowBuildingStructure(false);
    setShowAddUnit(true);
  };

  // Generate unit number based on building structure
  const generateUnitNumber = () => {
    const structure = buildingStructure || property.building_structure;
    if (structure === 'multiple') {
      // Format: B-5-9 (Block-Level-Room)
      if (newUnit.block && newUnit.level && newUnit.room_number) {
        return `${newUnit.block}-${newUnit.level}-${newUnit.room_number}`;
      }
    } else if (structure === 'single') {
      // Format: 5-9 (Level-Room)
      if (newUnit.level && newUnit.room_number) {
        return `${newUnit.level}-${newUnit.room_number}`;
      }
    }
    return '';
  };

  const generatedUnitNumber = generateUnitNumber();

  const handleAddUnit = async (e) => {
    e.preventDefault();
    setAddingUnit(true);
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/add-unit.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newUnit,
          unit_number: generatedUnitNumber,
          unit_type: newUnit.unit_type === 'Others' ? newUnit.custom_unit_type : newUnit.unit_type,
          property_id: property.property_id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowAddUnit(false);
        setNewUnit({
          block: '',
          level: '',
          room_number: '',
          unit_type: '',
          custom_unit_type: '',
          size_sqft: '',
          monthly_rent: property.monthly_rent || '',
          status: 'available',
          description: ''
        });
        fetchUnits();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error adding unit:', error);
      alert('Failed to add unit');
    } finally {
      setAddingUnit(false);
    }
  };

  const handleViewTenantDetails = (unit) => {
    setSelectedTenant({
      tenant_id: unit.tenant_id,
      tenant_name: unit.tenant_name,
      tenant_phone: unit.tenant_phone,
      move_in_date: unit.move_in_date,
      move_out_date: unit.move_out_date,
      tenant_status: unit.tenant_status,
      unit_number: unit.unit_number,
      unit_type: unit.unit_type,
      monthly_rent: unit.monthly_rent,
      size_sqft: unit.size_sqft
    });
    setShowTenantDetails(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'occupied': return 'bg-blue-100 text-blue-700';
      case 'maintenance': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-2 cursor-pointer"
          >
            ← Back to Properties
          </button>
          <h2 className="text-2xl font-bold text-gray-800">{property.property_name}</h2>
          <p className="text-gray-600 flex items-center gap-2">
            <MapPin size={16} />
            {property.address}, {property.city}, {property.state}
          </p>
        </div>
        <button
          onClick={handleAddUnitClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          Add Unit
        </button>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit) => (
          <div key={unit.unit_id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{unit.unit_number}</h3>
                {unit.block && (
                  <p className="text-sm text-gray-600">
                    Block {unit.block} {unit.level && `• Level ${unit.level}`} {unit.room_number && `• Room ${unit.room_number}`}
                  </p>
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(unit.status)}`}>
                {unit.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign size={16} className="text-green-600" />
                <span className="font-medium">RM {parseFloat(unit.monthly_rent).toLocaleString()}/month</span>
              </div>

              {unit.unit_type && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Home size={16} />
                  <span>{unit.unit_type}</span>
                </div>
              )}

              {unit.size_sqft && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 size={16} />
                  <span>{unit.size_sqft} sqft</span>
                </div>
              )}

              {unit.tenant_name ? (
                <div className="bg-blue-50 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
                    <User size={16} />
                    Current Tenant
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-blue-700 font-medium">{unit.tenant_name}</p>
                      {unit.tenant_phone && (
                        <p className="text-blue-600 text-sm">{unit.tenant_phone}</p>
                      )}
                    </div>
                    {unit.move_in_date && (
                      <div className="text-blue-600 text-sm">
                        <span className="font-medium">Move-in:</span> {new Date(unit.move_in_date).toLocaleDateString()}
                      </div>
                    )}
                    {unit.tenant_status && (
                      <div className="text-blue-600 text-sm">
                        <span className="font-medium">Status:</span> 
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                          unit.tenant_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {unit.tenant_status}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => handleViewTenantDetails(unit)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 cursor-pointer"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => navigate(`/landlord/tenants/edit/${unit.tenant_id}`)}
                        className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 rounded-lg p-3 mt-4">
                  <p className="text-green-700 text-sm font-medium">Available for rent</p>
                  <button 
                    onClick={() => navigate(`/landlord/add-tenant?property_id=${property.property_id}&unit_id=${unit.unit_id}`)}
                    className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 cursor-pointer"
                  >
                    Add Tenant
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Building Structure Modal */}
      {showBuildingStructure && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Building Structure</h3>
              <p className="text-gray-600 mb-6">Is this property a single building or multiple buildings?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleBuildingStructureSelect('single')}
                  className="w-full p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-left cursor-pointer"
                >
                  <div className="font-medium">Single Building</div>
                  <div className="text-sm text-gray-600">One building with multiple levels and rooms</div>
                </button>
                
                <button
                  onClick={() => handleBuildingStructureSelect('multiple')}
                  className="w-full p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-left cursor-pointer"
                >
                  <div className="font-medium">Multiple Buildings</div>
                  <div className="text-sm text-gray-600">Multiple blocks/buildings (A, B, C, etc.)</div>
                </button>
              </div>
              
              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setShowBuildingStructure(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddUnit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Unit</h3>
              <form onSubmit={handleAddUnit} className="space-y-4">
                {/* Generated Unit Number Display */}
                {generatedUnitNumber && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-blue-800 mb-1">Generated Unit Number</label>
                    <div className="text-lg font-bold text-blue-900">{generatedUnitNumber}</div>
                    <p className="text-xs text-blue-600 mt-1">This will be the unit identifier</p>
                  </div>
                )}

                <div className={`grid gap-3 ${(buildingStructure === 'multiple' || property.building_structure === 'multiple') ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {(buildingStructure === 'multiple' || property.building_structure === 'multiple') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Block *</label>
                      <input
                        type="text"
                        value={newUnit.block}
                        onChange={(e) => setNewUnit({...newUnit, block: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="A, B, C"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                    <input
                      type="text"
                      value={newUnit.level}
                      onChange={(e) => setNewUnit({...newUnit, level: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="5, 12, G"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room *</label>
                    <input
                      type="text"
                      value={newUnit.room_number}
                      onChange={(e) => setNewUnit({...newUnit, room_number: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="9, 03, 15"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
                  <select
                    value={newUnit.unit_type}
                    onChange={(e) => setNewUnit({...newUnit, unit_type: e.target.value, custom_unit_type: ''})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer"
                  >
                    <option value="">Select Unit Type</option>
                    <option value="Studio">Studio</option>
                    <option value="1BR">1 Bedroom</option>
                    <option value="2BR">2 Bedroom</option>
                    <option value="3BR">3 Bedroom</option>
                    <option value="4BR">4 Bedroom</option>
                    <option value="5BR">5 Bedroom</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Duplex">Duplex</option>
                    <option value="Others">Others</option>
                  </select>
                  
                  {newUnit.unit_type === 'Others' && (
                    <input
                      type="text"
                      value={newUnit.custom_unit_type}
                      onChange={(e) => setNewUnit({...newUnit, custom_unit_type: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                      placeholder="Enter custom unit type"
                      required
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size (sqft)</label>
                    <input
                      type="number"
                      value={newUnit.size_sqft}
                      onChange={(e) => setNewUnit({...newUnit, size_sqft: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newUnit.monthly_rent}
                      onChange={(e) => setNewUnit({...newUnit, monthly_rent: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newUnit.status}
                    onChange={(e) => setNewUnit({...newUnit, status: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer"
                  >
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newUnit.description}
                    onChange={(e) => setNewUnit({...newUnit, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows="3"
                    placeholder="Additional details about this unit..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddUnit(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!generatedUnitNumber || addingUnit}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center ${
                      !generatedUnitNumber || addingUnit
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                    }`}
                  >
                    {addingUnit ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Adding Unit...
                      </>
                    ) : (
                      'Add Unit'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Details Modal */}
      {showTenantDetails && selectedTenant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tenant Details</h3>
                <button
                  onClick={() => setShowTenantDetails(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Tenant Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Tenant Information</h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-blue-600 font-medium">Name:</span>
                      <p className="text-blue-900">{selectedTenant.tenant_name}</p>
                    </div>
                    {selectedTenant.tenant_phone && (
                      <div>
                        <span className="text-sm text-blue-600 font-medium">Phone:</span>
                        <p className="text-blue-900">{selectedTenant.tenant_phone}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-blue-600 font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        selectedTenant.tenant_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {selectedTenant.tenant_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Unit Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="w-5 h-5 text-gray-600" />
                    <h4 className="font-medium text-gray-900">Unit Information</h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Unit Number:</span>
                      <p className="text-gray-900">{selectedTenant.unit_number}</p>
                    </div>
                    {selectedTenant.unit_type && (
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Type:</span>
                        <p className="text-gray-900">{selectedTenant.unit_type}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Monthly Rent:</span>
                      <p className="text-gray-900">RM {parseFloat(selectedTenant.monthly_rent).toLocaleString()}</p>
                    </div>
                    {selectedTenant.size_sqft && (
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Size:</span>
                        <p className="text-gray-900">{selectedTenant.size_sqft} sqft</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lease Info */}
                {(selectedTenant.move_in_date || selectedTenant.move_out_date) && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium text-green-900">Lease Information</h4>
                    </div>
                    <div className="space-y-2">
                      {selectedTenant.move_in_date && (
                        <div>
                          <span className="text-sm text-green-600 font-medium">Move-in Date:</span>
                          <p className="text-green-900">{new Date(selectedTenant.move_in_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {selectedTenant.move_out_date && (
                        <div>
                          <span className="text-sm text-green-600 font-medium">Move-out Date:</span>
                          <p className="text-green-900">{new Date(selectedTenant.move_out_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {!selectedTenant.move_out_date && selectedTenant.move_in_date && (
                        <div>
                          <span className="text-sm text-green-600 font-medium">Lease Type:</span>
                          <p className="text-green-900">Open-ended</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setShowTenantDetails(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyUnitsManager;