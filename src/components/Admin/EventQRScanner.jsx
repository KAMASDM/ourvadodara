// =============================================
// src/components/Admin/EventQRScanner.jsx
// Dedicated Event QR Scanner for Admin URL Access
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
  LogIn,
  LogOut,
  ArrowLeft,
  Wifi,
  WifiOff
} from 'lucide-react';
import { ref, onValue, update, push, get } from 'firebase/database';
import { db } from '../../firebase-config';

const EventQRScanner = ({ eventId, onBack }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [scanMode, setScanMode] = useState('entry'); // entry or exit
  const [scanHistory, setScanHistory] = useState([]);
  const [currentlyInside, setCurrentlyInside] = useState([]);
  const [lastScan, setLastScan] = useState(null);
  const [manualQRCode, setManualQRCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load event data
  useEffect(() => {
    if (!eventId) return;

    const eventRef = ref(db, `events/${eventId}`);
    const unsubscribe = onValue(eventRef, (snapshot) => {
      if (snapshot.exists()) {
        const eventData = { id: eventId, ...snapshot.val() };
        setSelectedEvent(eventData);
        setScanMode(eventData.multipleQRScansAllowed ? 'entry' : 'checkin');
      } else {
        setError('Event not found');
      }
    });

    return () => unsubscribe();
  }, [eventId]);

  // Load scan history
  useEffect(() => {
    if (!eventId) return;

    const scansRef = ref(db, `eventScans/${eventId}`);
    const unsubscribe = onValue(scansRef, (snapshot) => {
      if (snapshot.exists()) {
        const scansData = snapshot.val();
        const scansArray = Object.entries(scansData).map(([id, scan]) => ({
          id,
          ...scan
        })).sort((a, b) => new Date(b.timestamp || b.checkedInAt) - new Date(a.timestamp || a.checkedInAt));
        
        setScanHistory(scansArray);

        // Calculate currently inside for multi-scan events
        if (selectedEvent?.multipleQRScansAllowed) {
          const userStatusMap = new Map();
          
          scansArray.forEach(scan => {
            const userId = scan.userId;
            if (!userStatusMap.has(userId)) {
              userStatusMap.set(userId, {
                userId,
                userName: scan.userName,
                userEmail: scan.userEmail,
                ticketType: scan.ticketType,
                isInside: false,
                totalEntries: 0,
                totalExits: 0,
                lastScan: scan.timestamp || scan.checkedInAt
              });
            }
            
            const userStatus = userStatusMap.get(userId);
            if (scan.action === 'entry') {
              userStatus.isInside = true;
              userStatus.totalEntries++;
            } else if (scan.action === 'exit') {
              userStatus.isInside = false;
              userStatus.totalExits++;
            }
            
            // Update last scan time if this is newer
            if (new Date(scan.timestamp || scan.checkedInAt) > new Date(userStatus.lastScan)) {
              userStatus.lastScan = scan.timestamp || scan.checkedInAt;
            }
          });
          
          const insideUsers = Array.from(userStatusMap.values()).filter(user => user.isInside);
          setCurrentlyInside(insideUsers);
        }
      } else {
        setScanHistory([]);
        setCurrentlyInside([]);
      }
    });

    return () => unsubscribe();
  }, [eventId, selectedEvent?.multipleQRScansAllowed]);

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // In a real implementation, you would use a QR code library here
    // For now, we'll simulate QR code detection
    const simulatedQRData = `event-${eventId}-user-${Math.random().toString(36).substr(2, 9)}`;
    processQRCode(simulatedQRData);
  };

  const processQRCode = async (qrData) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setError('');
    setScanResult(null);

    try {
      // Parse QR code data (implement your QR format here)
      const userData = parseQRCode(qrData);
      if (!userData) {
        throw new Error('Invalid QR code format');
      }

      // Check if user is registered for this event
      const registrationRef = ref(db, `eventRegistrations/${eventId}/${userData.userId}`);
      const registrationSnapshot = await get(registrationRef);
      
      if (!registrationSnapshot.exists()) {
        throw new Error('User not registered for this event');
      }

      const registrationData = registrationSnapshot.val();
      
      // Perform the scan action
      await performScan(userData, registrationData);
      
    } catch (error) {
      console.error('QR processing error:', error);
      setError(error.message);
      setScanResult({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseQRCode = (qrData) => {
    // Implement your QR code format parsing here
    // This is a simplified version
    try {
      if (qrData.includes('event-')) {
        const parts = qrData.split('-');
        return {
          userId: parts[parts.length - 1],
          eventId: parts[1]
        };
      }
      return JSON.parse(qrData);
    } catch {
      return null;
    }
  };

  const performScan = async (userData, registrationData) => {
    const scanData = {
      userId: userData.userId,
      userName: registrationData.userName,
      userEmail: registrationData.userEmail,
      userPhone: registrationData.userPhone,
      ticketType: registrationData.ticketType,
      timestamp: new Date().toISOString(),
      scannedBy: 'admin',
      action: selectedEvent.multipleQRScansAllowed ? scanMode : 'checkin'
    };

    // Save scan record
    const scansRef = ref(db, `eventScans/${eventId}`);
    await push(scansRef, scanData);

    // Update registration status
    const updateData = {
      checkedIn: true,
      checkedInAt: scanData.timestamp,
      checkedInBy: 'qr-scanner'
    };
    
    const registrationRef = ref(db, `eventRegistrations/${eventId}/${userData.userId}`);
    await update(registrationRef, updateData);

    // Set success result
    setScanResult({
      success: true,
      message: `${scanData.action === 'entry' ? 'Entry' : scanData.action === 'exit' ? 'Exit' : 'Check-in'} successful for ${registrationData.userName}`,
      timestamp: scanData.timestamp
    });

    setLastScan(scanData);
  };

  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
              <button
                onClick={onBack}
                className="mt-2 text-red-600 hover:text-red-800 text-sm"
              >
                ← Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold">QR Scanner</h1>
                <p className="text-blue-100">{selectedEvent.title}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Online Status */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isOnline ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
              }`}>
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              
              {/* Scan Counter */}
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{scanHistory.length}</span> scans
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scanner Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Mode Toggle for Multiple Scans */}
              {selectedEvent.multipleQRScansAllowed && (
                <div className="p-6 bg-gray-50 border-b">
                  <div className="flex justify-center">
                    <div className="bg-white rounded-lg p-1 flex shadow-sm">
                      <button
                        onClick={() => setScanMode('entry')}
                        className={`px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 flex items-center ${
                          scanMode === 'entry'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Entry Mode
                      </button>
                      <button
                        onClick={() => setScanMode('exit')}
                        className={`px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 flex items-center ${
                          scanMode === 'exit'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Exit Mode
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Scanner Area */}
                {!isScanning ? (
                  <div className="text-center">
                    <div className="w-80 h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <Camera className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium text-lg">Camera Ready</p>
                        <p className="text-gray-500">Tap to start scanning</p>
                      </div>
                    </div>
                    <button
                      onClick={startCamera}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center mx-auto shadow-lg transform hover:scale-105 transition-all duration-200 text-lg font-medium"
                    >
                      <Camera className="w-6 h-6 mr-3" />
                      Start Camera
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="relative w-80 h-80 mx-auto mb-6 rounded-xl overflow-hidden shadow-lg">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Scanner Overlay */}
                      <div className="absolute inset-0">
                        {/* Scanning frame */}
                        <div className="absolute inset-8 border-2 border-white rounded-lg">
                          {/* Corner indicators */}
                          <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-green-400"></div>
                          <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-green-400"></div>
                          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-green-400"></div>
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-green-400"></div>
                          
                          {/* Scanning line */}
                          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
                        </div>

                        {/* Mode indicator */}
                        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium ${
                          selectedEvent.multipleQRScansAllowed
                            ? scanMode === 'entry' 
                              ? 'bg-green-500/80 text-white' 
                              : 'bg-red-500/80 text-white'
                            : 'bg-blue-500/80 text-white'
                        }`}>
                          {selectedEvent.multipleQRScansAllowed 
                            ? (scanMode === 'entry' ? '🚪 ENTRY' : '🚪 EXIT')
                            : '✅ CHECK-IN'
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={captureFrame}
                        disabled={isProcessing}
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-lg hover:from-green-700 hover:to-green-800 flex items-center shadow-lg transform hover:scale-105 transition-all duration-200 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <QrCode className="w-6 h-6 mr-3" />
                            Scan QR Code
                          </>
                        )}
                      </button>
                      <button
                        onClick={stopCamera}
                        className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-4 rounded-lg hover:from-gray-700 hover:to-gray-800 flex items-center shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        <X className="w-5 h-5 mr-2" />
                        Stop
                      </button>
                    </div>
                  </div>
                )}

                {/* Manual Input */}
                <div className="mt-8 bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Manual QR Code Entry
                  </label>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={manualQRCode}
                      onChange={(e) => setManualQRCode(e.target.value)}
                      placeholder="Enter QR code manually..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && manualQRCode.trim() && !isProcessing) {
                          processQRCode(manualQRCode.trim());
                          setManualQRCode('');
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (manualQRCode.trim() && !isProcessing) {
                          processQRCode(manualQRCode.trim());
                          setManualQRCode('');
                        }
                      }}
                      disabled={!manualQRCode.trim() || isProcessing}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                        selectedEvent.multipleQRScansAllowed && scanMode === 'entry'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : selectedEvent.multipleQRScansAllowed && scanMode === 'exit'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                    >
                      {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <QrCode className="w-4 h-4 mr-2" />
                      )}
                      Scan
                    </button>
                  </div>
                </div>

                {/* Results */}
                {error && (
                  <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                    <div className="flex items-center">
                      <XCircle className="w-6 h-6 text-red-500 mr-3" />
                      <div>
                        <h4 className="text-red-800 font-medium">Scanner Error</h4>
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

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
          </div>

          {/* Stats & Recent Scans */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Scans</span>
                  <span className="font-semibold">{scanHistory.length}</span>
                </div>
                {selectedEvent.multipleQRScansAllowed && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Currently Inside</span>
                      <span className="font-semibold text-green-600">{currentlyInside.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Entries</span>
                      <span className="font-semibold">{scanHistory.filter(s => s.action === 'entry').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Exits</span>
                      <span className="font-semibold">{scanHistory.filter(s => s.action === 'exit').length}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recent Scans */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Recent Scans
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {scanHistory.slice(0, 10).map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{scan.userName}</div>
                      <div className="text-xs text-gray-500">{scan.userEmail}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(scan.timestamp || scan.checkedInAt).toLocaleTimeString()}
                      </div>
                    </div>
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
        </div>
      </div>

      {/* Hidden canvas for QR processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default EventQRScanner;