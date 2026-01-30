import React, { useCallback, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, ScanLine } from "lucide-react";
import type { ExpenseData } from "@/lib/expense-service";
import { useCategories } from "@/hooks/useCategories";
interface ExpenseFormProps {
  value: ExpenseData;
  onChange: (data: ExpenseData) => void;
}
export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  value,
  onChange,
}) => {
  // Use refs to keep stable references to latest value and onChange
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  }, [value, onChange]);

  // Use custom categories hook
  const { categories } = useCategories();

  const handleFieldChange = useCallback(
    (field: keyof ExpenseData, fieldValue: any) => {
      onChangeRef.current({ ...valueRef.current, [field]: fieldValue });
    },
    []
  );

  const handleLineItemChange = useCallback(
    (
      index: number,
      field: "description" | "quantity" | "price",
      fieldValue: string | number
    ) => {
      const newLineItems = [...valueRef.current.lineItems];
      newLineItems[index] = { ...newLineItems[index], [field]: fieldValue };
      onChangeRef.current({ ...valueRef.current, lineItems: newLineItems });
    },
    []
  );

  const addLineItem = useCallback(() => {
    const newLineItems = [
      ...valueRef.current.lineItems,
      { description: "", quantity: 1, price: 0 },
    ];
    onChangeRef.current({ ...valueRef.current, lineItems: newLineItems });
  }, []);

  const removeLineItem = useCallback((index: number) => {
    const newLineItems = valueRef.current.lineItems.filter(
      (_, i) => i !== index
    );
    onChangeRef.current({ ...valueRef.current, lineItems: newLineItems });
  }, []);
  return (
    <div className="space-y-3 sm:space-y-4 overflow-y-auto px-1 sm:pr-2 py-2 sm:py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="merchant" className="text-sm">
            Merchant
          </Label>
          <Input
            id="merchant"
            value={value.merchant}
            onChange={(e) => handleFieldChange("merchant", e.target.value)}
            className="text-sm sm:text-base"
          />
        </div>
        <div>
          <Label htmlFor="date" className="text-sm">
            Date
          </Label>
          <Input
            id="date"
            type="date"
            value={value.date}
            onChange={(e) => handleFieldChange("date", e.target.value)}
            className="text-sm sm:text-base"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="sm:col-span-1">
          <Label htmlFor="total" className="text-sm">
            Total
          </Label>
          <Input
            id="total"
            type="number"
            value={value.total === 0 ? "" : value.total}
            onChange={(e) =>
              handleFieldChange("total", parseFloat(e.target.value) || 0)
            }
            className="text-sm sm:text-base"
          />
        </div>
        <div className="sm:col-span-1">
          <Select
            value={value.category}
            onValueChange={(newValue) =>
              handleFieldChange("category", newValue)
            }
          >
            <SelectTrigger className="text-sm sm:text-base">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-1">
          <Label htmlFor="currency" className="text-sm">
            Currency
          </Label>
          <Input
            id="currency"
            value={value.currency}
            onChange={(e) =>
              handleFieldChange("currency", e.target.value.toUpperCase())
            }
            placeholder="e.g. USD"
            className="text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 pb-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={value.isRecurring || false}
              onChange={(e) =>
                handleFieldChange("isRecurring", e.target.checked)
              }
              className="h-4 w-4 rounded border-gray-300 text-focal-blue-600 focus:ring-focal-blue-500"
            />
            <Label htmlFor="isRecurring" className="text-sm cursor-pointer select-none font-medium">
              Recurring Expense?
            </Label>
          </div>

          {value.isRecurring && (
            <div className="min-w-[140px]">
              <Select
                value={value.recurringFrequency || "monthly"}
                onValueChange={(newValue) =>
                  handleFieldChange("recurringFrequency", newValue)
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <h3 className="font-semibold pt-3 sm:pt-4 border-t text-sm sm:text-base">
        Line Items
      </h3>
      {value.lineItems.length > 0 ? (
        value.lineItems.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-1.5 sm:gap-2 items-center"
          >
            <Input
              className="col-span-5 sm:col-span-6 text-xs sm:text-sm"
              placeholder="Description"
              value={item.description}
              onChange={(e) =>
                handleLineItemChange(index, "description", e.target.value)
              }
            />
            <Input
              className="col-span-2 text-xs sm:text-sm"
              type="number"
              step="any"
              placeholder="Qty"
              value={item.quantity === 0 ? "" : item.quantity}
              onChange={(e) =>
                handleLineItemChange(
                  index,
                  "quantity",
                  parseFloat(e.target.value) || 0
                )
              }
            />
            <Input
              className="col-span-4 sm:col-span-3 text-xs sm:text-sm"
              type="number"
              placeholder="Price"
              value={item.price === 0 ? "" : item.price}
              onChange={(e) =>
                handleLineItemChange(
                  index,
                  "price",
                  parseFloat(e.target.value) || 0
                )
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="col-span-1 h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => removeLineItem(index)}
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
            </Button>
          </div>
        ))
      ) : (
        <div className="text-center text-xs sm:text-sm text-muted-foreground py-3 sm:py-4 border rounded-md">
          <ScanLine className="mx-auto h-5 w-5 sm:h-6 sm:w-6 mb-2" />
          No line items were detected. You can add them manually.
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={addLineItem}
        className="text-xs sm:text-sm"
      >
        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
        Add Item
      </Button>
    </div>
  );
};
