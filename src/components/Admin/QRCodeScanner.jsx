// =============================================
// src/components/Admin/QRCodeScanner.jsx
// QR Code Scanner for Event Check-ins
// =============================================
import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Camera, 
  X, 
  CheckCircle, 
  XCircle, 
  Users, 
  Clock,
  MapPin,
  Ticket,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
  LogIn,
  LogOut
} from 'lucide-react';
import { ref, onValue, update, push, get } from 'firebase/database';
import { db } from '../../firebase-config';

const QRCodeScanner = ({ selectedEvent, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [checkedInUsers, setCheckedInUsers] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [currentlyInside, setCurrentlyInside] = useState([]);
  const [activeTab, setActiveTab] = useState('scanner'); // scanner, manual, history, analytics
  const [searchQuery, setSearchQuery] = useState('');
  const [scanMode, setScanMode] = useState('entry'); // entry, exit
  const [manualCheckIn, setManualCheckIn] = useState({
    email: '',
    phone: '',
    name: ''
  });
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (selectedEvent) {
      // Load checked-in users
      const checkedInRef = ref(db, `events/${selectedEvent.id}/checkedInUsers`);
      const unsubscribeCheckedIn = onValue(checkedInRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const checkedInArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setCheckedInUsers(checkedInArray.sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt)));
        } else {
          setCheckedInUsers([]);
        }
      });

      // Load registered users
      const registrationsRef = ref(db, `events/${selectedEvent.id}/registrations`);
      const unsubscribeRegistrations = onValue(registrationsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const registrationsArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setRegisteredUsers(registrationsArray);
        } else {
          setRegisteredUsers([]);
        }
      });

      // Load scan history
      const scanHistoryRef = ref(db, `events/${selectedEvent.id}/scanHistory`);
      const unsubscribeScanHistory = onValue(scanHistoryRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const historyArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setScanHistory(historyArray);
          
          // Calculate currently inside users
          const userStatusMap = {};
          historyArray.forEach(scan => {
            if (!userStatusMap[scan.userId]) {
              userStatusMap[scan.userId] = {
                userId: scan.userId,
                userName: scan.userName,
                userEmail: scan.userEmail,
                status: scan.action,
                lastScan: scan.timestamp,
                totalEntries: 0,
                totalExits: 0
              };
            }
            
            if (scan.action === 'entry') {
              userStatusMap[scan.userId].totalEntries++;
              userStatusMap[scan.userId].status = 'inside';
            } else if (scan.action === 'exit') {
              userStatusMap[scan.userId].totalExits++;
              userStatusMap[scan.userId].status = 'outside';
            }
            
            userStatusMap[scan.userId].lastScan = scan.timestamp;
          });
          
          const currentlyInsideUsers = Object.values(userStatusMap).filter(user => user.status === 'inside');
          setCurrentlyInside(currentlyInsideUsers);
        } else {
          setScanHistory([]);
          setCurrentlyInside([]);
        }
      });

      return () => {
        unsubscribeCheckedIn();
        unsubscribeRegistrations();
        unsubscribeScanHistory();
      };
    }
  }, [selectedEvent]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        setError('');
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera access error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Here you would typically use a QR code library to decode the image
      // For now, we'll simulate QR code scanning
      simulateQRScan(canvas);
    }
  };

  const simulateQRScan = (canvas) => {
    // This is a simulation - in a real app, you'd use a QR code library
    // like jsQR or qr-scanner
    try {
      // Simulate QR data
      const simulatedQRData = {
        eventId: selectedEvent.id,
        userId: `user_${Date.now()}`,
        registrationId: `reg_${Date.now()}`,
        timestamp: Date.now(),
        type: 'checkin'
      };
      
      processQRCode(JSON.stringify(simulatedQRData));
    } catch (err) {
      setError('Unable to read QR code. Please try again.');
    }
  };

  const processQRCode = async (qrData) => {
    try {
      const data = JSON.parse(qrData);
      
      if (data.eventId !== selectedEvent.id) {
        throw new Error('QR code is not for this event');
      }

      if (data.type !== 'checkin') {
        throw new Error('Invalid QR code type');
      }

      // Check if user is registered for this event
      const registrationRef = ref(db, `events/${selectedEvent.id}/registrations/${data.registrationId}`);
      const registrationSnapshot = await get(registrationRef);
      
      if (!registrationSnapshot.exists()) {
        throw new Error('Registration not found');
      }

      const registration = registrationSnapshot.val();

      // Check current status for multiple scan support
      if (selectedEvent.multipleQRScansAllowed) {
        // For multiple scans, check current status
        const currentUser = currentlyInside.find(user => user.userId === data.userId);
        const isCurrentlyInside = currentUser && currentUser.status === 'inside';
        
        if (scanMode === 'entry' && isCurrentlyInside) {
          throw new Error('User is already inside the event');
        }
        
        if (scanMode === 'exit' && !isCurrentlyInside) {
          throw new Error('User is not currently inside the event');
        }
        
        // Perform entry/exit scan
        await performScan(data.userId, registration, data.registrationId, scanMode);
      } else {
        // For single scan, check if already checked in
        const checkedInRef = ref(db, `events/${selectedEvent.id}/checkedInUsers/${data.userId}`);
        const checkedInSnapshot = await get(checkedInRef);
        
        if (checkedInSnapshot.exists()) {
          throw new Error('User already checked in (multiple scans not allowed for this event)');
        }

        // Perform single check-in
        await performCheckIn(data.userId, registration, data.registrationId);
      }
      
    } catch (err) {
      setError(err.message);
      setScanResult({
        success: false,
        message: err.message
      });
    }
  };

  const performScan = async (userId, registration, registrationId, action) => {
    try {
      const scanData = {
        userId,
        registrationId,
        userName: registration.userName || registration.email,
        userEmail: registration.email,
        userPhone: registration.phone,
        ticketType: registration.ticketType,
        action: action, // 'entry' or 'exit'
        timestamp: new Date().toISOString(),
        scannedBy: 'qr-scanner', // or admin user ID
        deviceInfo: navigator.userAgent
      };

      // Add to scan history
      await push(ref(db, `events/${selectedEvent.id}/scanHistory`), scanData);

      // Update analytics
      const analyticsRef = ref(db, `events/${selectedEvent.id}/analytics`);
      const analyticsSnapshot = await get(analyticsRef);
      const currentAnalytics = analyticsSnapshot.val() || {};
      
      const analyticsUpdate = {
        ...currentAnalytics,
        totalScans: (currentAnalytics.totalScans || 0) + 1
      };
      
      if (action === 'entry') {
        analyticsUpdate.totalEntries = (currentAnalytics.totalEntries || 0) + 1;
      } else {
        analyticsUpdate.totalExits = (currentAnalytics.totalExits || 0) + 1;
      }
      
      await update(analyticsRef, analyticsUpdate);

      setScanResult({
        success: true,
        message: `Successfully recorded ${action} for ${scanData.userName}`,
        userData: scanData
      });

      setError('');
    } catch (err) {
      console.error('Scan error:', err);
      setError('Failed to record scan. Please try again.');
    }
  };

  const performCheckIn = async (userId, registration, registrationId) => {
    try {
      const checkInData = {
        userId,
        registrationId,
        userName: registration.userName || registration.email,
        userEmail: registration.email,
        userPhone: registration.phone,
        ticketType: registration.ticketType,
        checkedInAt: new Date().toISOString(),
        checkedInBy: 'qr-scanner', // or admin user ID
        status: 'checked-in'
      };

      // Add to checked-in users
      await update(ref(db, `events/${selectedEvent.id}/checkedInUsers/${userId}`), checkInData);

      // Update registration status
      await update(ref(db, `events/${selectedEvent.id}/registrations/${registrationId}`), {
        ...registration,
        checkedIn: true,
        checkedInAt: checkInData.checkedInAt
      });

      // Update analytics
      const analyticsRef = ref(db, `events/${selectedEvent.id}/analytics`);
      const analyticsSnapshot = await get(analyticsRef);
      const currentAnalytics = analyticsSnapshot.val() || {};
      
      await update(analyticsRef, {
        ...currentAnalytics,
        checkins: (currentAnalytics.checkins || 0) + 1
      });

      setScanResult({
        success: true,
        message: `Successfully checked in ${checkInData.userName}`,
        userData: checkInData
      });

      setError('');
    } catch (err) {
      console.error('Check-in error:', err);
      setError('Failed to check in user. Please try again.');
    }
  };

  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    
    try {
      // Find registration by email or phone
      const registrations = registeredUsers.filter(reg => 
        reg.email === manualCheckIn.email || 
        reg.phone === manualCheckIn.phone ||
        reg.userName?.toLowerCase().includes(manualCheckIn.name.toLowerCase())
      );

      if (registrations.length === 0) {
        throw new Error('Registration not found');
      }

      if (registrations.length > 1) {
        throw new Error('Multiple registrations found. Please be more specific.');
      }

      const registration = registrations[0];
      
      // Check if already checked in
      const isAlreadyCheckedIn = checkedInUsers.some(user => 
        user.userEmail === registration.email || user.registrationId === registration.id
      );
      
      if (isAlreadyCheckedIn) {
        throw new Error('User already checked in');
      }

      await performCheckIn(`manual_${Date.now()}`, registration, registration.id);
      
      // Reset form
      setManualCheckIn({ email: '', phone: '', name: '' });
      
    } catch (err) {
      setError(err.message);
    }
  };

  const exportCheckInData = () => {
    const csvData = [
      ['Name', 'Email', 'Phone', 'Ticket Type', 'Check-in Time', 'Method'].join(','),
      ...checkedInUsers.map(user => [
        user.userName,
        user.userEmail,
        user.userPhone || '',
        user.ticketType,
        new Date(user.checkedInAt).toLocaleString(),
        user.checkedInBy === 'qr-scanner' ? 'QR Code' : 'Manual'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEvent.title}_checkins_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredCheckedInUsers = checkedInUsers.filter(user =>
    user.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.userPhone?.includes(searchQuery)
  );

  if (!selectedEvent) {
    return (
      <div className="text-center py-12">
        <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Event Selected</h3>
        <p className="text-gray-500">Please select an event to start check-in process</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Check-in Scanner</h2>
          <p className="text-gray-600">{selectedEvent.title}</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {selectedEvent.venue?.name}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {selectedEvent.startDate} {selectedEvent.startTime}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right text-sm">
            <div className="font-medium text-gray-900">
              {checkedInUsers.length} / {registeredUsers.length} checked in
            </div>
            <div className="text-gray-500">
              {((checkedInUsers.length / (registeredUsers.length || 1)) * 100).toFixed(1)}% attendance
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-900">{registeredUsers.length}</div>
              <div className="text-sm text-blue-600">Registered</div>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-900">{currentlyInside.length}</div>
              <div className="text-sm text-green-600">Currently Inside</div>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <QrCode className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-orange-900">{scanHistory.length}</div>
              <div className="text-sm text-orange-600">Total Scans</div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">
                {registeredUsers.length - new Set(scanHistory.map(s => s.userId)).size}
              </div>
              <div className="text-sm text-yellow-600">Never Scanned</div>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <Ticket className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-900">
                {((new Set(scanHistory.map(s => s.userId)).size / (registeredUsers.length || 1)) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-purple-600">Scan Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'scanner', name: 'QR Scanner', icon: QrCode },
            { id: 'manual', name: 'Manual Check-in', icon: Users },
            { id: 'history', name: 'Scan History', icon: Clock },
            { id: 'analytics', name: 'Entry Analytics', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced QR Scanner */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Scanner Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Event Scanner</h3>
                  <p className="text-blue-100 text-sm mt-1">Live QR Code Scanning</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isScanning 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white/20 text-white'
                }`}>
                  <div className={`w-2 h-2 rounded-full inline-block mr-2 ${
                    isScanning ? 'bg-white animate-pulse' : 'bg-white/60'
                  }`}></div>
                  {isScanning ? 'ACTIVE' : 'READY'}
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Mode Toggle for Multiple Scans */}
              {selectedEvent.multipleQRScansAllowed && (
                <div className="flex justify-center mb-6">
                  <div className="bg-gray-100 rounded-lg p-1 flex">
                    <button
                      onClick={() => setScanMode('entry')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center ${
                        scanMode === 'entry'
                          ? 'bg-green-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Entry Mode
                    </button>
                    <button
                      onClick={() => setScanMode('exit')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center ${
                        scanMode === 'exit'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Exit Mode
                    </button>
                  </div>
                </div>
              )}
              
              {!isScanning ? (
                <div className="text-center">
                  <div className="w-72 h-72 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <Camera className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Camera Ready</p>
                      <p className="text-gray-500 text-sm">Tap to start scanning</p>
                    </div>
                  </div>
                  <button
                    onClick={startCamera}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center mx-auto shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Start Camera
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="relative w-72 h-72 mx-auto mb-6 rounded-xl overflow-hidden shadow-lg">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Enhanced Scanner Overlay */}
                    <div className="absolute inset-0">
                      {/* Scanning frame */}
                      <div className="absolute inset-4 border-2 border-white rounded-lg">
                        {/* Corner indicators */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-green-400"></div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-green-400"></div>
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-green-400"></div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-green-400"></div>
                        
                        {/* Scanning line */}
                        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
                      </div>

                      {/* Mode indicator */}
                      <div className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium ${
                        selectedEvent.multipleQRScansAllowed
                          ? scanMode === 'entry' 
                            ? 'bg-green-500/80 text-white' 
                            : 'bg-red-500/80 text-white'
                          : 'bg-blue-500/80 text-white'
                      }`}>
                        {selectedEvent.multipleQRScansAllowed 
                          ? (scanMode === 'entry' ? 'ENTRY' : 'EXIT')
                          : 'CHECK-IN'
                        }
                      </div>

                      {/* Scan counter */}
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs">
                        Scans: {scanHistory.length}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={captureFrame}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 flex items-center shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      <QrCode className="w-5 h-5 mr-2" />
                      Scan QR Code
                    </button>
                    <button
                      onClick={stopCamera}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-lg hover:from-gray-700 hover:to-gray-800 flex items-center shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Stop Camera
                    </button>
                  </div>
                </div>
              )}

              {/* Enhanced Error Display */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-center">
                  <XCircle className="w-6 h-6 text-red-500 mr-3" />
                  <div>
                    <h4 className="text-red-800 font-medium">Scanner Error</h4>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Enhanced Scan Result Display */}
              {scanResult && (
                <div className={`mt-6 p-4 border-l-4 rounded-lg ${
                  scanResult.success 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-red-50 border-red-400'
                }`}>
                  <div className="flex items-start">
                    {scanResult.success ? (
                      <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 mr-3 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`font-medium ${scanResult.success ? 'text-green-800' : 'text-red-800'}`}>
                        {scanResult.success ? 'Scan Successful' : 'Scan Failed'}
                      </h4>
                      <p className={`text-sm ${scanResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {scanResult.message}
                      </p>
                      {scanResult.timestamp && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(scanResult.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Scans */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scanHistory.slice(0, 10).map((scan, index) => (
                <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{scan.userName}</div>
                    <div className="text-sm text-gray-500">{scan.userEmail}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(scan.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      scan.action === 'entry' 
                        ? 'bg-green-100 text-green-800' 
                        : scan.action === 'exit'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {scan.action === 'entry' ? 'Entry' : scan.action === 'exit' ? 'Exit' : 'Check-in'}
                    </span>
                  </div>
                </div>
              ))}
              {scanHistory.length === 0 && (
                <div className="text-center py-8">
                  <QrCode className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No scans yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Check-in</h3>
            <form onSubmit={handleManualCheckIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={manualCheckIn.name}
                  onChange={(e) => setManualCheckIn(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter attendee name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={manualCheckIn.email}
                  onChange={(e) => setManualCheckIn(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={manualCheckIn.phone}
                  onChange={(e) => setManualCheckIn(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Users className="w-5 h-5 mr-2" />
                Check In User
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          {/* Search and Export */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search scans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={exportCheckInData}
              className="ml-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>

          {/* Scan History Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scanner
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scanHistory.filter(scan => 
                    scan.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    scan.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((scan) => (
                    <tr key={scan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{scan.userName}</div>
                        <div className="text-sm text-gray-500">{scan.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          scan.action === 'entry' 
                            ? 'bg-green-100 text-green-800' 
                            : scan.action === 'exit'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {scan.action?.toUpperCase() || 'CHECK-IN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {scan.ticketType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(scan.timestamp || scan.checkedInAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          QR Scanner
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {scanHistory.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No scans found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Currently Inside Users */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-600" />
              Currently Inside Event ({currentlyInside.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentlyInside.map((user) => (
                <div key={user.userId} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">{user.userName}</div>
                    <span className="px-2 py-1 text-xs bg-green-600 text-white rounded-full">Inside</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{user.userEmail}</div>
                  <div className="text-xs text-gray-500">
                    <div>Entries: {user.totalEntries}</div>
                    <div>Exits: {user.totalExits}</div>
                    <div>Last scan: {new Date(user.lastScan).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {currentlyInside.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No one currently inside</p>
                </div>
              )}
            </div>
          </div>

          {/* Entry/Exit Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Entry/Exit Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Entry/Exit Summary</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Entries</span>
                  <span className="font-semibold text-green-600">
                    {scanHistory.filter(s => s.action === 'entry').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Exits</span>
                  <span className="font-semibold text-red-600">
                    {scanHistory.filter(s => s.action === 'exit').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Unique Visitors</span>
                  <span className="font-semibold text-blue-600">
                    {new Set(scanHistory.map(s => s.userId)).size}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Peak Attendance</span>
                  <span className="font-semibold text-purple-600">
                    {Math.max(...Array.from(new Set(scanHistory.map(s => s.userId))).map(userId => {
                      const userScans = scanHistory.filter(s => s.userId === userId);
                      let inside = 0;
                      let maxInside = 0;
                      userScans.forEach(scan => {
                        if (scan.action === 'entry') inside++;
                        else if (scan.action === 'exit') inside--;
                        maxInside = Math.max(maxInside, inside);
                      });
                      return maxInside;
                    }), 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {scanHistory.slice(0, 8).map((scan) => (
                  <div key={scan.id} className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      scan.action === 'entry' ? 'bg-green-500' : 
                      scan.action === 'exit' ? 'bg-red-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {scan.userName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {scan.action === 'entry' ? 'Entered' : 
                         scan.action === 'exit' ? 'Exited' : 'Checked in'} • {new Date(scan.timestamp || scan.checkedInAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {scanHistory.length === 0 && (
                  <div className="text-center py-4">
                    <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No activity yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;