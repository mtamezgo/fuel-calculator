import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { useTranslation } from "~/lib/i18n/context";

interface BlendProduct {
  id: string;
  name: string;
  price: number;
  percentage: number;
}

interface BlendPreset {
  id: string;
  name: string;
  products: BlendProduct[];
}

// Individual input component that handles its own local state
function NumberInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder: string;
  className?: string;
}) {
  const [localValue, setLocalValue] = useState(value ? value.toString() : "");

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value ? value.toString() : "");
  }, [value]);

  const handleBlur = () => {
    const cleaned = localValue.replace(/,/g, "");
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      onChange(num);
      setLocalValue(num.toString());
    } else {
      setLocalValue(value ? value.toString() : "");
    }
  };

  return (
    <Input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}

export function BlendCalculator() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<BlendProduct[]>([
    { id: crypto.randomUUID(), name: "", price: 0, percentage: 0 },
    { id: crypto.randomUUID(), name: "", price: 0, percentage: 0 },
  ]);
  const [presets, setPresets] = useState<BlendPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [presetName, setPresetName] = useState("");

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const response = await fetch("/api/blend-presets");
      if (response.ok) {
        const data = await response.json();
        setPresets(data);
      }
    } catch (error) {
      console.error("Failed to load presets:", error);
    }
  };

  const addProduct = () => {
    setProducts([
      ...products,
      { id: crypto.randomUUID(), name: "", price: 0, percentage: 0 },
    ]);
  };

  const removeProduct = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const updateProduct = (id: string, field: keyof BlendProduct, value: string | number) => {
    setProducts(
      products.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  const totalPercentage = products.reduce((sum, p) => sum + (p.percentage || 0), 0);
  const isValidPercentage = Math.abs(totalPercentage - 100) < 0.01;

  const blendPrice = isValidPercentage
    ? products.reduce((sum, p) => sum + (p.price || 0) * (p.percentage || 0), 0) / 100
    : 0;

  const formatNumber = (num: number, decimals: number = 4) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  // Preset functions
  const savePreset = async () => {
    if (!presetName.trim()) {
      alert(t("blendCalculator.enterPresetNameAlert"));
      return;
    }

    try {
      const response = await fetch("/api/blend-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: presetName,
          products: products,
        }),
      });

      if (response.ok) {
        alert(t("blendCalculator.presetSaved").replace("{name}", presetName));
        setPresetName("");
        loadPresets();
      } else {
        alert(t("blendCalculator.failedToSavePreset"));
      }
    } catch (error) {
      alert(t("blendCalculator.failedToSavePreset"));
    }
  };

  const loadPreset = (id: string) => {
    const preset = presets.find((p) => p.id === id);
    if (preset) {
      setProducts(preset.products.map(p => ({ ...p, id: crypto.randomUUID() })));
      setSelectedPresetId(id);
      alert(t("blendCalculator.presetLoaded").replace("{name}", preset.name));
    }
  };

  const updatePreset = async () => {
    if (!selectedPresetId) {
      alert(t("blendCalculator.selectPresetToUpdate"));
      return;
    }

    const preset = presets.find((p) => p.id === selectedPresetId);
    if (!preset) return;

    if (!confirm(t("blendCalculator.updatePresetConfirm").replace("{name}", preset.name))) {
      return;
    }

    try {
      const response = await fetch("/api/blend-presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPresetId,
          products: products,
        }),
      });

      if (response.ok) {
        alert(t("blendCalculator.presetUpdated").replace("{name}", preset.name));
        loadPresets();
      } else {
        alert(t("blendCalculator.failedToUpdatePreset"));
      }
    } catch (error) {
      alert(t("blendCalculator.failedToUpdatePreset"));
    }
  };

  const deletePreset = async () => {
    if (!selectedPresetId) {
      alert(t("blendCalculator.selectPresetToDelete"));
      return;
    }

    const preset = presets.find((p) => p.id === selectedPresetId);
    if (!preset) return;

    if (!confirm(t("blendCalculator.deletePresetConfirm").replace("{name}", preset.name))) {
      return;
    }

    try {
      const response = await fetch(`/api/blend-presets?id=${selectedPresetId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert(t("blendCalculator.presetDeleted").replace("{name}", preset.name));
        setSelectedPresetId("");
        loadPresets();
      } else {
        alert(t("blendCalculator.failedToDeletePreset"));
      }
    } catch (error) {
      alert(t("blendCalculator.failedToDeletePreset"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Presets Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#262626] uppercase tracking-wide">
          {t("blendCalculator.presets")}
        </h3>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedPresetId}
            onChange={(e) => setSelectedPresetId(e.target.value)}
            className="flex-1 h-9 rounded-md border border-[#dbdbdb] bg-white px-3 text-sm"
          >
            <option value="">{t("blendCalculator.selectPreset")}</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedPresetId && loadPreset(selectedPresetId)}
              disabled={!selectedPresetId}
            >
              {t("common.load")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={updatePreset}
              disabled={!selectedPresetId}
            >
              {t("common.update")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deletePreset}
              disabled={!selectedPresetId}
              className="text-red-500 hover:text-red-600"
            >
              {t("common.delete")}
            </Button>
          </div>
        </div>

        {/* Save New Preset */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder={t("blendCalculator.enterPresetName")}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={savePreset}
            className="whitespace-nowrap"
          >
            {t("blendCalculator.savePreset")}
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#262626] uppercase tracking-wide">
          {t("blendCalculator.products")}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#dbdbdb]">
                <th className="text-left text-xs font-semibold text-[#8e8e8e] uppercase tracking-wide py-2 px-2">
                  {t("blendCalculator.product")}
                </th>
                <th className="text-left text-xs font-semibold text-[#8e8e8e] uppercase tracking-wide py-2 px-2">
                  {t("blendCalculator.price")}
                </th>
                <th className="text-left text-xs font-semibold text-[#8e8e8e] uppercase tracking-wide py-2 px-2">
                  {t("blendCalculator.percentage")}
                </th>
                <th className="text-left text-xs font-semibold text-[#8e8e8e] uppercase tracking-wide py-2 px-2 w-16">
                  {t("blendCalculator.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-[#dbdbdb]">
                  <td className="py-2 px-2">
                    <Input
                      value={product.name}
                      onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                      placeholder={t("blendCalculator.productName")}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <NumberInput
                      value={product.price}
                      onChange={(val) => updateProduct(product.id, "price", val)}
                      placeholder="0.0000"
                      className="h-8 text-sm w-32"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <NumberInput
                        value={product.percentage}
                        onChange={(val) => updateProduct(product.id, "percentage", val)}
                        placeholder="0.00"
                        className="h-8 text-sm w-24"
                      />
                      <span className="text-sm text-[#8e8e8e]">%</span>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(product.id)}
                      disabled={products.length <= 1}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={addProduct}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("blendCalculator.addProduct")}
        </Button>
      </div>

      {/* Results Section */}
      <div className="bg-[#fafafa] border border-[#dbdbdb] rounded-md p-4 space-y-3">
        {/* Total Percentage */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-[#262626]">
            {t("blendCalculator.totalPercentage")}:
          </span>
          <span
            className={`text-sm font-bold ${
              isValidPercentage ? "text-green-600" : "text-red-500"
            }`}
          >
            {formatNumber(totalPercentage, 2)}%
          </span>
        </div>

        {!isValidPercentage && (
          <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
            {t("blendCalculator.percentageError")}
          </div>
        )}

        {/* Blend Price */}
        <div className="flex justify-between items-center pt-2 border-t border-[#dbdbdb]">
          <span className="text-base font-semibold text-[#262626]">
            {t("blendCalculator.blendPrice")}:
          </span>
          <span
            className={`text-xl font-bold ${
              isValidPercentage ? "text-[#262626]" : "text-[#8e8e8e]"
            }`}
          >
            ${formatNumber(blendPrice, 4)}
          </span>
        </div>
      </div>
    </div>
  );
}
