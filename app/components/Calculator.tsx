import { useState, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "~/components/ui/table";
import { GripVertical, Trash2, Plus, Share2, FileDown, ChevronUp, ChevronDown } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Constants
const LITERS_PER_GALLON = 3.78541;

// Types
interface Concept {
  id: number;
  name: string;
  value: number;
  inputType: "mxnLtr" | "mxn" | "usd" | "usdGal";
  isBase?: boolean;
}

interface Preset {
  id: string;
  name: string;
  exchangeRate: number;
  basePrice: number;
  gallons: number;
  liters: number;
  margin: number;
  marginInputType: string;
  concepts: Concept[];
}

export function Calculator() {
  // State
  const [exchangeRate, setExchangeRate] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [basePriceInputType, setBasePriceInputType] = useState<"mxnLtr" | "mxn" | "usd" | "usdGal">("usdGal");
  const [gallons, setGallons] = useState(0);
  const [liters, setLiters] = useState(0);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [presetName, setPresetName] = useState("");
  const [decimalPlaces, setDecimalPlaces] = useState(4);
  const [margin, setMargin] = useState(0);
  const [marginInputType, setMarginInputType] = useState<"mxnLtr" | "mxn" | "usd" | "usdGal">("mxnLtr");
  const [draggedRow, setDraggedRow] = useState<number | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Initialize with base concept
  useEffect(() => {
    if (concepts.length === 0) {
      setConcepts([{
        id: Date.now(),
        name: "Molecule Price",
        value: 0,
        inputType: "usdGal",
        isBase: true,
      }]);
    }
  }, []);

  // Load presets from API
  useEffect(() => {
    loadPresets();
  }, []);

  async function loadPresets() {
    try {
      const response = await fetch("/api/presets");
      if (response.ok) {
        const data = await response.json();
        setPresets(data);
      }
    } catch (error) {
      console.error("Failed to load presets:", error);
    }
  }

  // Conversion functions
  const gallonsToLiters = (gal: number) => gal * LITERS_PER_GALLON;
  const litersToGallons = (ltr: number) => ltr / LITERS_PER_GALLON;
  const usdToMxn = (usd: number, rate: number) => usd * rate;
  const mxnToUsd = (mxn: number, rate: number) => mxn / rate;
  const usdPerGalToMxnPerLtr = (usdGal: number, rate: number) => (usdGal / LITERS_PER_GALLON) * rate;
  const mxnPerLtrToUsdPerGal = (mxnLtr: number, rate: number) => (mxnLtr / rate) * LITERS_PER_GALLON;

  // Update base price from any column input
  const updateBasePriceFromInput = (value: number, inputType: "mxnLtr" | "mxn" | "usd" | "usdGal") => {
    let usdGalValue: number;
    switch (inputType) {
      case "mxnLtr":
        usdGalValue = mxnPerLtrToUsdPerGal(value, exchangeRate);
        break;
      case "mxn":
        usdGalValue = liters ? mxnPerLtrToUsdPerGal(value / liters, exchangeRate) : 0;
        break;
      case "usd":
        usdGalValue = gallons ? value / gallons : 0;
        break;
      case "usdGal":
      default:
        usdGalValue = value;
        break;
    }
    setBasePrice(usdGalValue);
    setBasePriceInputType(inputType);
  };

  // Format number with commas
  const formatNumber = (value: number, decimals?: number) => {
    const places = decimals !== undefined ? decimals : decimalPlaces;
    const formatted = parseFloat(String(value)).toFixed(places);
    const parts = formatted.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  const parseFormattedNumber = (value: string | number) => {
    if (typeof value === "number") return value;
    return parseFloat(value.toString().replace(/,/g, "")) || 0;
  };

  // Calculate values for concept
  const calculateMxnLtr = (concept: Concept) => {
    if (concept.isBase) {
      return usdPerGalToMxnPerLtr(basePrice, exchangeRate);
    }
    switch (concept.inputType) {
      case "mxnLtr": return concept.value;
      case "mxn": return liters ? concept.value / liters : 0;
      case "usd": return liters ? usdToMxn(concept.value, exchangeRate) / liters : 0;
      case "usdGal": return usdPerGalToMxnPerLtr(concept.value, exchangeRate);
      default: return 0;
    }
  };

  const calculateMxn = (concept: Concept) => {
    if (concept.isBase) {
      return calculateMxnLtr(concept) * liters;
    }
    switch (concept.inputType) {
      case "mxnLtr": return concept.value * liters;
      case "mxn": return concept.value;
      case "usd": return usdToMxn(concept.value, exchangeRate);
      case "usdGal": return usdPerGalToMxnPerLtr(concept.value, exchangeRate) * liters;
      default: return 0;
    }
  };

  const calculateUsd = (concept: Concept) => {
    if (concept.isBase) {
      return basePrice * gallons;
    }
    switch (concept.inputType) {
      case "mxnLtr": return mxnToUsd(concept.value * liters, exchangeRate);
      case "mxn": return mxnToUsd(concept.value, exchangeRate);
      case "usd": return concept.value;
      case "usdGal": return concept.value * gallons;
      default: return 0;
    }
  };

  const calculateUsdGal = (concept: Concept) => {
    if (concept.isBase) return basePrice;
    switch (concept.inputType) {
      case "mxnLtr": return mxnPerLtrToUsdPerGal(concept.value, exchangeRate);
      case "mxn": return gallons ? mxnToUsd(concept.value, exchangeRate) / gallons : 0;
      case "usd": return gallons ? concept.value / gallons : 0;
      case "usdGal": return concept.value;
      default: return 0;
    }
  };

  // Calculate totals
  const totals = concepts.reduce(
    (acc, concept) => ({
      mxnLtr: acc.mxnLtr + calculateMxnLtr(concept),
      mxn: acc.mxn + calculateMxn(concept),
      usd: acc.usd + calculateUsd(concept),
      usdGal: acc.usdGal + calculateUsdGal(concept),
    }),
    { mxnLtr: 0, mxn: 0, usd: 0, usdGal: 0 }
  );

  // Calculate margin values
  const calculateMarginValue = (type: "mxnLtr" | "mxn" | "usd" | "usdGal") => {
    switch (marginInputType) {
      case "mxnLtr":
        if (type === "mxnLtr") return margin;
        if (type === "mxn") return margin * liters;
        if (type === "usd") return mxnToUsd(margin * liters, exchangeRate);
        if (type === "usdGal") return mxnPerLtrToUsdPerGal(margin, exchangeRate);
        break;
      case "mxn":
        if (type === "mxnLtr") return liters ? margin / liters : 0;
        if (type === "mxn") return margin;
        if (type === "usd") return mxnToUsd(margin, exchangeRate);
        if (type === "usdGal") return gallons ? mxnToUsd(margin, exchangeRate) / gallons : 0;
        break;
      case "usd":
        if (type === "mxnLtr") return liters ? usdToMxn(margin, exchangeRate) / liters : 0;
        if (type === "mxn") return usdToMxn(margin, exchangeRate);
        if (type === "usd") return margin;
        if (type === "usdGal") return gallons ? margin / gallons : 0;
        break;
      case "usdGal":
        if (type === "mxnLtr") return usdPerGalToMxnPerLtr(margin, exchangeRate);
        if (type === "mxn") return usdPerGalToMxnPerLtr(margin, exchangeRate) * liters;
        if (type === "usd") return margin * gallons;
        if (type === "usdGal") return margin;
        break;
    }
    return 0;
  };

  const marginValues = {
    mxnLtr: calculateMarginValue("mxnLtr"),
    mxn: calculateMarginValue("mxn"),
    usd: calculateMarginValue("usd"),
    usdGal: calculateMarginValue("usdGal"),
  };

  // Sale price = totals + margin
  const salePrice = {
    mxnLtr: totals.mxnLtr + marginValues.mxnLtr,
    mxn: totals.mxn + marginValues.mxn,
    usd: totals.usd + marginValues.usd,
    usdGal: totals.usdGal + marginValues.usdGal,
  };

  // Event handlers
  const handleExchangeRateFetch = async () => {
    try {
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const data = await response.json();
      setExchangeRate(data.rates.MXN);
    } catch (error) {
      console.error("Failed to fetch exchange rate:", error);
      alert("Failed to fetch exchange rate. Please enter manually.");
    }
  };

  const handleGallonsChange = (value: number) => {
    setGallons(value);
    setLiters(gallonsToLiters(value));
  };

  const handleLitersChange = (value: number) => {
    setLiters(value);
    setGallons(litersToGallons(value));
  };

  const addConcept = () => {
    setConcepts([...concepts, {
      id: Date.now(),
      name: "New Cost",
      value: 0,
      inputType: "mxnLtr",
    }]);
  };

  const deleteConcept = (id: number) => {
    setConcepts(concepts.filter(c => c.id !== id));
  };

  const updateConceptName = (id: number, name: string) => {
    setConcepts(concepts.map(c => c.id === id ? { ...c, name } : c));
  };

  const updateConceptValue = (id: number, value: string, inputType: "mxnLtr" | "mxn" | "usd" | "usdGal") => {
    const numValue = parseFormattedNumber(value);
    setConcepts(concepts.map(c => c.id === id ? { ...c, value: numValue, inputType } : c));
  };

  // Drag and drop handlers (desktop)
  const handleDragStart = (id: number) => {
    setDraggedRow(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: number) => {
    if (draggedRow === null || draggedRow === targetId) return;

    const draggedIndex = concepts.findIndex(c => c.id === draggedRow);
    const targetIndex = concepts.findIndex(c => c.id === targetId);

    const newConcepts = [...concepts];
    const [removed] = newConcepts.splice(draggedIndex, 1);
    newConcepts.splice(targetIndex, 0, removed);

    setConcepts(newConcepts);
    setDraggedRow(null);
  };

  // Move row up/down (for mobile - uses buttons instead of drag)
  const moveRowUp = (id: number) => {
    const index = concepts.findIndex(c => c.id === id);
    if (index <= 0) return;
    const newConcepts = [...concepts];
    [newConcepts[index - 1], newConcepts[index]] = [newConcepts[index], newConcepts[index - 1]];
    setConcepts(newConcepts);
  };

  const moveRowDown = (id: number) => {
    const index = concepts.findIndex(c => c.id === id);
    if (index < 0 || index >= concepts.length - 1) return;
    const newConcepts = [...concepts];
    [newConcepts[index], newConcepts[index + 1]] = [newConcepts[index + 1], newConcepts[index]];
    setConcepts(newConcepts);
  };

  // Preset management
  const savePreset = async () => {
    if (!presetName.trim()) {
      alert("Please enter a preset name");
      return;
    }

    try {
      const response = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: presetName,
          exchangeRate,
          basePrice,
          gallons,
          liters,
          margin,
          marginInputType,
          concepts,
        }),
      });

      if (response.ok) {
        await loadPresets();
        setPresetName("");
        alert(`Preset "${presetName}" saved successfully!`);
      }
    } catch (error) {
      console.error("Failed to save preset:", error);
      alert("Failed to save preset");
    }
  };

  const loadPreset = async (id: string) => {
    const preset = presets.find(p => p.id === id);
    if (!preset) return;

    setExchangeRate(preset.exchangeRate);
    setBasePrice(preset.basePrice);
    setGallons(preset.gallons);
    setLiters(preset.liters);
    setMargin(preset.margin);
    setMarginInputType(preset.marginInputType as any);
    setConcepts(preset.concepts);
    alert(`Preset "${preset.name}" loaded successfully!`);
  };

  const updatePreset = async () => {
    if (!selectedPreset) {
      alert("Please select a preset to update");
      return;
    }

    const preset = presets.find(p => p.id === selectedPreset);
    if (!preset) return;

    if (!confirm(`Update preset "${preset.name}" with current values?`)) return;

    try {
      const response = await fetch("/api/presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPreset,
          name: preset.name,
          exchangeRate,
          basePrice,
          gallons,
          liters,
          margin,
          marginInputType,
          concepts,
        }),
      });

      if (response.ok) {
        await loadPresets();
        alert(`Preset "${preset.name}" updated successfully!`);
      }
    } catch (error) {
      console.error("Failed to update preset:", error);
      alert("Failed to update preset");
    }
  };

  const deletePreset = async () => {
    if (!selectedPreset) {
      alert("Please select a preset to delete");
      return;
    }

    const preset = presets.find(p => p.id === selectedPreset);
    if (!preset) return;

    if (!confirm(`Are you sure you want to delete preset "${preset.name}"?`)) return;

    try {
      const response = await fetch(`/api/presets?id=${selectedPreset}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadPresets();
        setSelectedPreset("");
        alert(`Preset "${preset.name}" deleted successfully!`);
      }
    } catch (error) {
      console.error("Failed to delete preset:", error);
      alert("Failed to delete preset");
    }
  };

  // WhatsApp sharing
  const shareToWhatsApp = async () => {
    if (!tableRef.current) return;

    setIsSharing(true);

    try {
      // Find the actual table element inside the container
      const tableElement = tableRef.current.querySelector("table");
      if (!tableElement) return;

      // Clone the table to capture it without overflow constraints
      const clone = tableElement.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.backgroundColor = "#ffffff";

      // Remove the actions column (last column) from the clone
      const headerRow = clone.querySelector("thead tr");
      const bodyRows = clone.querySelectorAll("tbody tr");
      const footerRow = clone.querySelector("tfoot tr");

      if (headerRow?.lastElementChild) headerRow.lastElementChild.remove();
      bodyRows.forEach(row => row.lastElementChild?.remove());
      if (footerRow?.lastElementChild) footerRow.lastElementChild.remove();

      document.body.appendChild(clone);

      // Get width after removing actions column
      const cloneWidth = clone.scrollWidth;
      clone.style.width = `${cloneWidth}px`;

      // Capture the cloned table
      const canvas = await html2canvas(clone, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        width: cloneWidth,
      });

      // Remove the clone
      document.body.removeChild(clone);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.95);
      });

      const file = new File([blob], "fuel-calculator.jpg", { type: "image/jpeg" });

      // Check if we're on mobile and can use Web Share API
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Fuel Calculator Results",
          text: `Exchange Rate: ${formatNumber(exchangeRate, 4)}\nTotal Cost: ${formatNumber(totals.mxn)} MXN`,
          files: [file],
        });
      } else {
        // Desktop: Download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "fuel-calculator.jpg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Provide WhatsApp links
        const text = encodeURIComponent(
          `Fuel Calculator Results\nExchange Rate: ${formatNumber(exchangeRate, 4)}\nTotal Cost: ${formatNumber(totals.mxn)} MXN`
        );
        const whatsappWeb = `https://web.whatsapp.com/send?text=${text}`;
        const whatsappDesktop = `whatsapp://send?text=${text}`;

        // Show options to user
        if (confirm("Image downloaded! Would you like to open WhatsApp Web to share?")) {
          window.open(whatsappWeb, "_blank");
        } else if (confirm("Would you like to open WhatsApp Desktop?")) {
          window.location.href = whatsappDesktop;
        }
      }
    } catch (error) {
      console.error("Failed to share:", error);
      alert("Failed to create shareable image");
    } finally {
      setIsSharing(false);
    }
  };

  // PDF export
  const exportToPdf = async () => {
    if (!tableRef.current) return;

    setIsSharing(true);

    try {
      // Find the actual table element inside the container
      const tableElement = tableRef.current.querySelector("table");
      if (!tableElement) return;

      // Clone the table to capture it without overflow constraints
      const clone = tableElement.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.backgroundColor = "#ffffff";

      // Remove the actions column (last column) from the clone
      const headerRow = clone.querySelector("thead tr");
      const bodyRows = clone.querySelectorAll("tbody tr");
      const footerRow = clone.querySelector("tfoot tr");

      if (headerRow?.lastElementChild) headerRow.lastElementChild.remove();
      bodyRows.forEach(row => row.lastElementChild?.remove());
      if (footerRow?.lastElementChild) footerRow.lastElementChild.remove();

      document.body.appendChild(clone);

      // Get width after removing actions column
      const cloneWidth = clone.scrollWidth;
      clone.style.width = `${cloneWidth}px`;

      // Capture the cloned table
      const canvas = await html2canvas(clone, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        width: cloneWidth,
      });

      // Remove the clone
      document.body.removeChild(clone);

      // Get image dimensions
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Create PDF in landscape mode for wide table
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? "landscape" : "portrait",
        unit: "px",
        format: [imgWidth, imgHeight],
      });

      // Add the image to PDF
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // Download the PDF
      pdf.save("fuel-calculator.pdf");
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Failed to create PDF");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Presets Section */}
      <div className="bg-[#fafafa] p-3 sm:p-4 rounded-sm border border-[#dbdbdb]">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm">Presets</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger className="w-full sm:flex-1">
                  <SelectValue placeholder="-- Select a Preset --" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 sm:flex-none" onClick={() => selectedPreset && loadPreset(selectedPreset)}>
                  Load
                </Button>
                <Button size="sm" variant="secondary" className="flex-1 sm:flex-none" onClick={updatePreset}>
                  Update
                </Button>
                <Button variant="destructive" size="sm" className="flex-1 sm:flex-none" onClick={deletePreset}>
                  Delete
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Save New Preset</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter preset name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={savePreset}>Save</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Input Controls */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">Exchange Rate (MXN per USD)</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="number"
              step="0.0001"
              placeholder="Enter exchange rate"
              value={exchangeRate || ""}
              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
              className="flex-1"
            />
            <Button variant="secondary" size="sm" className="whitespace-nowrap" onClick={handleExchangeRateFetch}>
              Fetch Rate
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-sm">Base Price (USD/Gal)</Label>
            <Input
              key={`basePrice-${basePrice}-${basePriceInputType}`}
              type="text"
              placeholder="0.0000"
              defaultValue={basePrice !== 0 ? formatNumber(basePrice) : ""}
              onBlur={(e) => {
                setBasePrice(parseFormattedNumber(e.target.value));
                setBasePriceInputType("usdGal");
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Gallons</Label>
            <Input
              key={`gallons-${gallons}`}
              type="text"
              placeholder="0.00"
              defaultValue={gallons !== 0 ? formatNumber(gallons, 2) : ""}
              onBlur={(e) => handleGallonsChange(parseFormattedNumber(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Liters</Label>
            <Input
              key={`liters-${liters}`}
              type="text"
              placeholder="0.00"
              defaultValue={liters !== 0 ? formatNumber(liters, 2) : ""}
              onBlur={(e) => handleLitersChange(parseFormattedNumber(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-[#262626]">Cost Breakdown</h2>
          <div className="grid grid-cols-2 sm:flex gap-2">
            <Button variant="secondary" size="sm" className="text-xs sm:text-sm" onClick={shareToWhatsApp} disabled={isSharing}>
              <Share2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{isSharing ? "Creating..." : "Share"}</span>
              <span className="sm:hidden">{isSharing ? "..." : "Share"}</span>
            </Button>
            <Button variant="secondary" size="sm" className="text-xs sm:text-sm" onClick={exportToPdf} disabled={isSharing}>
              <FileDown className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{isSharing ? "Creating..." : "PDF"}</span>
              <span className="sm:hidden">{isSharing ? "..." : "PDF"}</span>
            </Button>
            <Button variant="secondary" size="sm" className="text-xs sm:text-sm" onClick={() => setDecimalPlaces(decimalPlaces === 4 ? 2 : 4)}>
              {decimalPlaces === 4 ? 2 : 4} Dec
            </Button>
            <Button size="sm" className="text-xs sm:text-sm" onClick={addConcept}>
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Add
            </Button>
          </div>
        </div>

        <div ref={tableRef} className="border border-[#dbdbdb] rounded-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#fafafa]">
                <TableHead className="font-semibold text-[#262626] w-[200px] min-w-[200px] pr-4">CONCEPT</TableHead>
                <TableHead className="font-semibold text-[#262626] w-[140px] min-w-[140px]">MXN/LTR</TableHead>
                <TableHead className="font-semibold text-[#262626] w-[140px] min-w-[140px]">MXN</TableHead>
                <TableHead className="font-semibold text-[#262626] w-[140px] min-w-[140px]">USD</TableHead>
                <TableHead className="font-semibold text-[#262626] w-[140px] min-w-[140px]">USD/GAL</TableHead>
                {!isSharing && <TableHead className="font-semibold text-[#262626] w-[100px] min-w-[100px]">ACTIONS</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {concepts.map((concept) => (
                <TableRow
                  key={concept.id}
                  data-row-id={concept.id}
                  draggable={!isSharing}
                  onDragStart={() => handleDragStart(concept.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(concept.id)}
                  className={`cursor-move hover:bg-[#fafafa] ${draggedRow === concept.id ? 'bg-blue-50' : ''}`}
                >
                  <TableCell className="relative w-[200px] min-w-[200px] pr-4">
                    {!isSharing && (
                      <>
                        {/* Desktop: Drag handle */}
                        <div className="hidden sm:flex absolute left-0 top-0 bottom-0 w-6 items-center justify-center cursor-grab active:cursor-grabbing select-none">
                          <GripVertical className="h-4 w-4 text-[#8e8e8e]" />
                        </div>
                        {/* Mobile: Up/Down buttons */}
                        <div className="sm:hidden absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center justify-center gap-0">
                          <button
                            type="button"
                            onClick={() => moveRowUp(concept.id)}
                            className="p-0.5 text-[#8e8e8e] hover:text-[#262626] disabled:opacity-30"
                            disabled={concepts.findIndex(c => c.id === concept.id) === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRowDown(concept.id)}
                            className="p-0.5 text-[#8e8e8e] hover:text-[#262626] disabled:opacity-30"
                            disabled={concepts.findIndex(c => c.id === concept.id) === concepts.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                    <Input
                      className={`${isSharing ? "" : "ml-6 sm:ml-6"} overflow-hidden text-ellipsis`}
                      value={concept.name}
                      onChange={(e) => updateConceptName(concept.id, e.target.value)}
                      disabled={concept.isBase}
                    />
                  </TableCell>
                  <TableCell className="w-[140px] min-w-[140px]">
                    <Input
                      key={`${concept.id}-mxnLtr-${decimalPlaces}-${concept.isBase ? (basePriceInputType !== "mxnLtr" ? formatNumber(calculateMxnLtr(concept)) : "edit") : (concept.inputType !== "mxnLtr" ? formatNumber(calculateMxnLtr(concept)) : "edit")}`}
                      type="text"
                      defaultValue={calculateMxnLtr(concept) !== 0 ? formatNumber(calculateMxnLtr(concept)) : ""}
                      onBlur={(e) => {
                        const val = parseFormattedNumber(e.target.value);
                        if (concept.isBase) {
                          updateBasePriceFromInput(val, "mxnLtr");
                        } else {
                          updateConceptValue(concept.id, String(val), "mxnLtr");
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="w-[140px] min-w-[140px]">
                    <Input
                      key={`${concept.id}-mxn-${decimalPlaces}-${concept.isBase ? (basePriceInputType !== "mxn" ? formatNumber(calculateMxn(concept)) : "edit") : (concept.inputType !== "mxn" ? formatNumber(calculateMxn(concept)) : "edit")}`}
                      type="text"
                      defaultValue={calculateMxn(concept) !== 0 ? formatNumber(calculateMxn(concept)) : ""}
                      onBlur={(e) => {
                        const val = parseFormattedNumber(e.target.value);
                        if (concept.isBase) {
                          updateBasePriceFromInput(val, "mxn");
                        } else {
                          updateConceptValue(concept.id, String(val), "mxn");
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="w-[140px] min-w-[140px]">
                    <Input
                      key={`${concept.id}-usd-${decimalPlaces}-${concept.isBase ? (basePriceInputType !== "usd" ? formatNumber(calculateUsd(concept)) : "edit") : (concept.inputType !== "usd" ? formatNumber(calculateUsd(concept)) : "edit")}`}
                      type="text"
                      defaultValue={calculateUsd(concept) !== 0 ? formatNumber(calculateUsd(concept)) : ""}
                      onBlur={(e) => {
                        const val = parseFormattedNumber(e.target.value);
                        if (concept.isBase) {
                          updateBasePriceFromInput(val, "usd");
                        } else {
                          updateConceptValue(concept.id, String(val), "usd");
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="w-[140px] min-w-[140px]">
                    <Input
                      key={`${concept.id}-usdGal-${decimalPlaces}-${concept.isBase ? (basePriceInputType !== "usdGal" ? formatNumber(basePrice) : "edit") : (concept.inputType !== "usdGal" ? formatNumber(calculateUsdGal(concept)) : "edit")}`}
                      type="text"
                      defaultValue={concept.isBase ? (basePrice !== 0 ? formatNumber(basePrice) : "") : (calculateUsdGal(concept) !== 0 ? formatNumber(calculateUsdGal(concept)) : "")}
                      onBlur={(e) => {
                        const val = parseFormattedNumber(e.target.value);
                        if (concept.isBase) {
                          updateBasePriceFromInput(val, "usdGal");
                        } else {
                          updateConceptValue(concept.id, String(val), "usdGal");
                        }
                      }}
                    />
                  </TableCell>
                  {!isSharing && (
                    <TableCell className="w-[100px] min-w-[100px]">
                      {!concept.isBase && (
                        <Button variant="destructive" size="sm" onClick={() => deleteConcept(concept.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>

            <TableFooter className="bg-[#fafafa]">
              <TableRow className="border-t-2 border-[#dbdbdb]">
                <TableCell className="font-semibold text-[#262626] w-[200px] min-w-[200px] pr-4">TOTAL COST</TableCell>
                <TableCell className="font-semibold w-[140px] min-w-[140px]">{formatNumber(totals.mxnLtr)}</TableCell>
                <TableCell className="font-semibold w-[140px] min-w-[140px]">{formatNumber(totals.mxn)}</TableCell>
                <TableCell className="font-semibold w-[140px] min-w-[140px]">{formatNumber(totals.usd)}</TableCell>
                <TableCell className="font-semibold w-[140px] min-w-[140px]">{formatNumber(totals.usdGal)}</TableCell>
                {!isSharing && <TableCell className="w-[100px] min-w-[100px]"></TableCell>}
              </TableRow>

              <TableRow className="border-t border-[#efefef]">
                <TableCell className="font-semibold text-[#262626] w-[200px] min-w-[200px] pr-4">MARGIN</TableCell>
                <TableCell className="w-[140px] min-w-[140px]">
                  <Input
                    key={`margin-mxnLtr-${decimalPlaces}-${marginInputType !== "mxnLtr" ? formatNumber(marginValues.mxnLtr) : "edit"}`}
                    type="text"
                    defaultValue={marginValues.mxnLtr !== 0 ? formatNumber(marginValues.mxnLtr) : ""}
                    onBlur={(e) => { setMargin(parseFormattedNumber(e.target.value)); setMarginInputType("mxnLtr"); }}
                  />
                </TableCell>
                <TableCell className="w-[140px] min-w-[140px]">
                  <Input
                    key={`margin-mxn-${decimalPlaces}-${marginInputType !== "mxn" ? formatNumber(marginValues.mxn) : "edit"}`}
                    type="text"
                    defaultValue={marginValues.mxn !== 0 ? formatNumber(marginValues.mxn) : ""}
                    onBlur={(e) => { setMargin(parseFormattedNumber(e.target.value)); setMarginInputType("mxn"); }}
                  />
                </TableCell>
                <TableCell className="w-[140px] min-w-[140px]">
                  <Input
                    key={`margin-usd-${decimalPlaces}-${marginInputType !== "usd" ? formatNumber(marginValues.usd) : "edit"}`}
                    type="text"
                    defaultValue={marginValues.usd !== 0 ? formatNumber(marginValues.usd) : ""}
                    onBlur={(e) => { setMargin(parseFormattedNumber(e.target.value)); setMarginInputType("usd"); }}
                  />
                </TableCell>
                <TableCell className="w-[140px] min-w-[140px]">
                  <Input
                    key={`margin-usdGal-${decimalPlaces}-${marginInputType !== "usdGal" ? formatNumber(marginValues.usdGal) : "edit"}`}
                    type="text"
                    defaultValue={marginValues.usdGal !== 0 ? formatNumber(marginValues.usdGal) : ""}
                    onBlur={(e) => { setMargin(parseFormattedNumber(e.target.value)); setMarginInputType("usdGal"); }}
                  />
                </TableCell>
                {!isSharing && <TableCell className="w-[100px] min-w-[100px]"></TableCell>}
              </TableRow>

              <TableRow className="border-t border-[#efefef]">
                <TableCell className="font-bold text-[#0095f6] w-[200px] min-w-[200px] pr-4">SALE PRICE</TableCell>
                <TableCell className="font-bold text-[#0095f6] w-[140px] min-w-[140px]">{formatNumber(salePrice.mxnLtr)}</TableCell>
                <TableCell className="font-bold text-[#0095f6] w-[140px] min-w-[140px]">{formatNumber(salePrice.mxn)}</TableCell>
                <TableCell className="font-bold text-[#0095f6] w-[140px] min-w-[140px]">{formatNumber(salePrice.usd)}</TableCell>
                <TableCell className="font-bold text-[#0095f6] w-[140px] min-w-[140px]">{formatNumber(salePrice.usdGal)}</TableCell>
                {!isSharing && <TableCell className="w-[100px] min-w-[100px]"></TableCell>}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  );
}
