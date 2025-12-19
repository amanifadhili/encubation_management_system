import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import Modal from "../components/Modal";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import Badge from "../components/Badge";
import {
  generateBarcode,
  scanBarcode,
  getQRCodeData,
  bulkGenerateBarcodes,
  getInventory,
  getInventoryItem
} from "../services/api";

const BarcodeScannerPage = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [scannedItem, setScannedItem] = useState<any | null>(null);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [generatedBarcode, setGeneratedBarcode] = useState<any | null>(null);
  const [generatedQRCode, setGeneratedQRCode] = useState<any | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isManager = user?.role === "manager" || user?.role === "director";

  useEffect(() => {
    if (user) {
      loadInventory();
    }
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [user]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await withRetry(() => getInventory(), { maxRetries: 3, initialDelay: 1000 });
      setInventory(Array.isArray(data) ? data : []);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleScanBarcode = async (barcode: string) => {
    if (!barcode || barcode.trim() === "") {
      showToast("Please enter a barcode", "error");
      return;
    }

    try {
      const response = await scanBarcode(barcode.trim());
      if (response.success && response.data) {
        setScannedItem(response.data.item || response.data);
        setShowItemModal(true);
        showToast("Item found!", "success");
      } else {
        showToast(response.message || "Item not found", "error");
        setScannedItem(null);
      }
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'scanning barcode');
      setScannedItem(null);
    }
  };

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleScanBarcode(manualBarcode);
  };

  const handleGenerateBarcode = async () => {
    if (!selectedItem) {
      showToast("Please select an item", "error");
      return;
    }

    try {
      const response = await generateBarcode(selectedItem);
      if (response.success && response.data) {
        setGeneratedBarcode(response.data);
        setShowBarcodeModal(true);
        showToast("Barcode generated successfully!", "success");
      } else {
        showToast(response.message || "Failed to generate barcode", "error");
      }
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'generating barcode');
    }
  };

  const handleGenerateQRCode = async () => {
    if (!selectedItem) {
      showToast("Please select an item", "error");
      return;
    }

    try {
      const response = await getQRCodeData(selectedItem);
      if (response.success && response.data) {
        setGeneratedQRCode(response.data);
        setShowQRCodeModal(true);
        showToast("QR code generated successfully!", "success");
      } else {
        showToast(response.message || "Failed to generate QR code", "error");
      }
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'generating QR code');
    }
  };

  const handleBulkGenerate = async () => {
    setBulkGenerating(true);
    try {
      const itemsWithoutBarcodes = inventory.filter(item => !item.barcode);
      if (itemsWithoutBarcodes.length === 0) {
        showToast("All items already have barcodes", "info");
        return;
      }

      const response = await bulkGenerateBarcodes({
        item_ids: itemsWithoutBarcodes.map(item => item.id),
        generate_for_all: false
      });

      if (response.success) {
        showToast(`Generated barcodes for ${response.data?.count || itemsWithoutBarcodes.length} items`, "success");
        await loadInventory();
      } else {
        showToast(response.message || "Failed to generate barcodes", "error");
      }
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'bulk generating barcodes');
    } finally {
      setBulkGenerating(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const selectedInventoryItem = inventory.find(item => item.id === selectedItem);

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-green-600 to-green-400 rounded shadow p-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Barcode & QR Code Scanner</h1>
          <div className="text-white opacity-90 mb-2">Scan, generate, and manage barcodes for inventory items</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Scan Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Scan Barcode/QR Code</h2>
            
            <div className="mb-4">
              <label className="block mb-2 font-semibold text-gray-700">Manual Barcode Entry</label>
              <form onSubmit={handleManualScan} className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={e => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode or scan..."
                  className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-200 text-gray-900"
                  disabled={scanning}
                />
                <ButtonLoader
                  loading={scanning}
                  onClick={() => handleScanBarcode(manualBarcode)}
                  label="Scan"
                  variant="primary"
                  className="bg-gradient-to-r from-green-700 to-green-500 hover:from-green-800 hover:to-green-600"
                  type="submit"
                />
              </form>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <p>Note: Camera-based scanning requires browser permissions and may not work on all devices.</p>
            </div>

            {scannedItem && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-sm font-semibold text-green-800 mb-2">Last Scanned:</p>
                <p className="text-gray-900">{scannedItem.name || scannedItem.item?.name || "Unknown Item"}</p>
                <button
                  onClick={() => setShowItemModal(true)}
                  className="mt-2 text-sm text-green-700 hover:text-green-900 underline"
                >
                  View Details
                </button>
              </div>
            )}
          </div>

          {/* Generate Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Generate Barcode/QR Code</h2>
            
            <div className="mb-4">
              <label className="block mb-2 font-semibold text-gray-700">Select Item</label>
              <select
                value={selectedItem}
                onChange={e => setSelectedItem(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-200 text-gray-900"
              >
                <option value="">Select an item...</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.barcode ? `(Barcode: ${item.barcode})` : "(No barcode)"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 mb-4">
              <ButtonLoader
                loading={false}
                onClick={handleGenerateBarcode}
                label="Generate Barcode"
                variant="secondary"
                disabled={!selectedItem}
                className="flex-1"
              />
              <ButtonLoader
                loading={false}
                onClick={handleGenerateQRCode}
                label="Generate QR Code"
                variant="secondary"
                disabled={!selectedItem}
                className="flex-1"
              />
            </div>

            {isManager && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Bulk Operations</p>
                <ButtonLoader
                  loading={bulkGenerating}
                  onClick={handleBulkGenerate}
                  label={bulkGenerating ? "Generating..." : "Generate Barcodes for All Items"}
                  variant="primary"
                  className="w-full bg-gradient-to-r from-green-700 to-green-500 hover:from-green-800 hover:to-green-600"
                  disabled={bulkGenerating}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Generates barcodes for items that don't have one
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Items</div>
            <div className="text-2xl font-bold text-gray-900">{inventory.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Items with Barcodes</div>
            <div className="text-2xl font-bold text-green-600">
              {inventory.filter(item => item.barcode).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Items without Barcodes</div>
            <div className="text-2xl font-bold text-yellow-600">
              {inventory.filter(item => !item.barcode).length}
            </div>
          </div>
        </div>

        {/* Barcode Display Modal */}
        <Modal
          title="Generated Barcode"
          open={showBarcodeModal}
          onClose={() => {
            setShowBarcodeModal(false);
            setGeneratedBarcode(null);
          }}
          actions={null}
        >
          {generatedBarcode && (
            <div className="space-y-4">
              {selectedInventoryItem && (
                <div className="mb-4">
                  <p className="font-semibold text-gray-900">{selectedInventoryItem.name}</p>
                  <p className="text-sm text-gray-600">Barcode: {generatedBarcode.barcode || selectedInventoryItem.barcode}</p>
                </div>
              )}
              {generatedBarcode.barcode_image_url && (
                <div className="flex justify-center mb-4">
                  <img
                    src={generatedBarcode.barcode_image_url}
                    alt="Barcode"
                    className="max-w-full h-auto border rounded p-4 bg-white"
                  />
                </div>
              )}
              {generatedBarcode.barcode_image_url && (
                <div className="flex justify-end gap-2">
                  <ButtonLoader
                    loading={false}
                    onClick={() => downloadImage(generatedBarcode.barcode_image_url, `barcode-${selectedInventoryItem?.name || 'item'}.png`)}
                    label="Download"
                    variant="primary"
                  />
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* QR Code Display Modal */}
        <Modal
          title="Generated QR Code"
          open={showQRCodeModal}
          onClose={() => {
            setShowQRCodeModal(false);
            setGeneratedQRCode(null);
          }}
          actions={null}
        >
          {generatedQRCode && (
            <div className="space-y-4">
              {selectedInventoryItem && (
                <div className="mb-4">
                  <p className="font-semibold text-gray-900">{selectedInventoryItem.name}</p>
                  <p className="text-sm text-gray-600">QR Code Data: {generatedQRCode.qr_data || generatedQRCode.data}</p>
                </div>
              )}
              {generatedQRCode.qr_code_image_url && (
                <div className="flex justify-center mb-4">
                  <img
                    src={generatedQRCode.qr_code_image_url}
                    alt="QR Code"
                    className="max-w-xs h-auto border rounded p-4 bg-white"
                  />
                </div>
              )}
              {generatedQRCode.qr_code_image_url && (
                <div className="flex justify-end gap-2">
                  <ButtonLoader
                    loading={false}
                    onClick={() => downloadImage(generatedQRCode.qr_code_image_url, `qrcode-${selectedInventoryItem?.name || 'item'}.png`)}
                    label="Download"
                    variant="primary"
                  />
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Scanned Item Details Modal */}
        <Modal
          title="Scanned Item Details"
          open={showItemModal}
          onClose={() => {
            setShowItemModal(false);
            setScannedItem(null);
          }}
          actions={null}
        >
          {scannedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{scannedItem.name || scannedItem.item?.name || "-"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{scannedItem.category || scannedItem.item?.category || "-"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">SKU</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{scannedItem.sku || scannedItem.item?.sku || "-"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Barcode</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{scannedItem.barcode || scannedItem.item?.barcode || "-"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Status</label>
                  <p className="mt-1">
                    <Badge variant={scannedItem.status === "available" ? "success" : "default"}>
                      {scannedItem.status || scannedItem.item?.status || "-"}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Available Quantity</label>
                  <p className="mt-1 text-sm text-gray-900">{scannedItem.available_quantity ?? scannedItem.item?.available_quantity ?? 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{scannedItem.location?.name || scannedItem.item?.location?.name || "-"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Supplier</label>
                  <p className="mt-1 text-sm text-gray-900">{scannedItem.supplier?.name || scannedItem.item?.supplier?.name || "-"}</p>
                </div>
              </div>
              {scannedItem.description && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{scannedItem.description || scannedItem.item?.description || "-"}</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default BarcodeScannerPage;

