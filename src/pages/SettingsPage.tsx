import React, { useState, useEffect } from "react";
import { FileDown, Loader, Save, Info } from "lucide-react";
import { expenseService } from "@/lib/expense-service";
import { BudgetSettings } from "@/components/BudgetSettings";
import { ApiKeysManager } from "@/components/ApiKeysManager";
import { CategoryManager } from "@/components/CategoryManager";
import { TagsManager } from "@/components/TagsManager";
import { useUserSettings, AIProvider } from "@/hooks/useUserSettings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const CURRENCIES = ["CAD", "EGP", "EUR", "GBP", "JPY", "SAR", "USD"];
const AI_PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: "gemini", label: "Google Gemini" },
  { value: "openai", label: "OpenAI" },
  { value: "nvidia", label: "NVIDIA" },
  { value: "groq", label: "Groq" },
];

export const SettingsPage: React.FC = () => {
  const {
    defaultCurrency,
    aiProvider: savedAiProvider,
    isLoading,
    isSaving,
    updateSettings,
  } = useUserSettings();

  // Local state for form editing
  const [currency, setCurrency] = useState(defaultCurrency);
  const [aiProvider, setAiProvider] = useState<AIProvider>(savedAiProvider);
  const [isExporting, setIsExporting] = useState(false);

  // Sync local state when settings are loaded
  useEffect(() => {
    setCurrency(defaultCurrency);
    setAiProvider(savedAiProvider);
  }, [defaultCurrency, savedAiProvider]);

  const handleSave = async () => {
    const success = await updateSettings({
      defaultCurrency: currency,
      aiProvider: aiProvider,
    });

    if (success) {
      toast.success("Settings Saved", {
        description: "Your preferences have been updated successfully.",
      });
    } else {
      toast.error("Failed to save settings. Please try again.");
    }
  };

  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(true);
    try {
      const response = await expenseService.getExpenses();
      if (response.success && response.data) {
        const data = response.data;
        let blob: Blob;
        let filename: string;

        if (format === "json") {
          const jsonString = JSON.stringify(data, null, 2);
          blob = new Blob([jsonString], { type: "application/json" });
          filename = `financemate-expenses-${new Date().toISOString().split("T")[0]}.json`;
        } else {
          // Convert to CSV
          const headers = [
            "Date",
            "Merchant",
            "Total",
            "Currency",
            "Category",
            "Description",
          ];
          const csvRows = [headers.join(",")];

          for (const expense of data) {
            const row = [
              expense.date,
              `"${expense.merchant}"`,
              expense.total,
              expense.currency,
              `"${expense.category}"`,
              // Combine line items or just use a summary
              `"${expense.lineItems.map((i) => i.description).join("; ")}"`,
            ];
            csvRows.push(row.join(","));
          }

          blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
          filename = `financemate-expenses-${new Date().toISOString().split("T")[0]}.csv`;
        }

        // Trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success("Export Successful", {
          description: `Your ${format.toUpperCase()} file has been downloaded.`,
        });
      } else {
        toast.error("Export Failed", {
          description: response.error || "Could not retrieve data.",
        });
      }
    } catch (e) {
      toast.error("Export Error", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage your application preferences.
        </p>
      </header>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Choose your preferred AI provider for receipt scanning. You have
              10 free scans per day.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6">
            <div className="grid md:grid-cols-3 items-start gap-4">
              <Label htmlFor="ai-provider" className="md:text-right md:mt-2">
                AI Provider
              </Label>
              <div className="md:col-span-2 space-y-2">
                <Select
                  value={aiProvider}
                  onValueChange={(value) => setAiProvider(value as AIProvider)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div className="flex flex-col">
                          <span>{provider.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Switch providers if one isn't working or to try different
                  accuracy levels.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 items-center gap-4">
              <Label htmlFor="currency" className="md:text-right">
                Default Currency
              </Label>
              <div className="md:col-span-2">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  This currency will be automatically assigned to new expenses.
                </p>
              </div>
            </div>
          </div>


          <div className="pt-6 border-t">
            <h2 className="text-lg font-medium mb-4">Data Management</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Export Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Download a copy of your expense data.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleExport("csv")}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="mr-2 h-4 w-4" />
                    )}
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport("json")}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="mr-2 h-4 w-4" />
                    )}
                    JSON
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <ApiKeysManager />
          </div>

          <div className="pt-6 border-t">
            <CategoryManager />
          </div>

          <div className="pt-6 border-t">
            <TagsManager />
          </div>

          <div className="pt-6 border-t">
            <BudgetSettings />
          </div>

          <footer className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </footer>
        </div>
      )}

    </div>
  );
};
