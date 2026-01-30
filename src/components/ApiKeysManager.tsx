import React, { useState } from "react";
import { Copy, Plus, Trash2, Key, Check } from "lucide-react";
import { format } from "date-fns";
import { useApiKeys } from "@/hooks/useApiKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const ApiKeysManager: React.FC = () => {
    const { keys, isLoading, isCreating, createKey, revokeKey, createdKey, clearCreatedKey } = useApiKeys();
    const [newKeyName, setNewKeyName] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showKeyDialog, setShowKeyDialog] = useState(false);

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) return;

        const result = await createKey(newKeyName);
        if (result.success) {
            setIsDialogOpen(false);
            setNewKeyName("");
            setShowKeyDialog(true);
            toast.success("API Key Created", {
                description: "Make sure to copy your key now. You won't be able to see it again.",
            });
        } else {
            toast.error("Failed to Create API Key", {
                description: result.error,
            });
        }
    };

    const handleRevokeKey = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to revoke the key "${name}"? This action cannot be undone.`)) {
            const success = await revokeKey(id);
            if (success) {
                toast.success("API Key Revoked", {
                    description: `The key "${name}" has been revoked successfully.`,
                });
            } else {
                toast.error("Failed to Revoke API Key");
            }
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard");
        } catch (err) {
            toast.error("Failed to copy");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium">API Keys</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage API keys for external access (e.g., Moltbot).
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Generate New Key
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate API Key</DialogTitle>
                            <DialogDescription>
                                Enter a name for this API key to identify it later (e.g., "Moltbot Integration").
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    className="col-span-3"
                                    placeholder="My API Key"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateKey} disabled={isCreating || !newKeyName.trim()}>
                                {isCreating ? "Generating..." : "Generate Key"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">Loading keys...</div>
            ) : keys.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-muted/20">
                    <Key className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
                    <h3 className="text-sm font-medium">No API Keys</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                        Generate an API key to allow external applications to access your Focal account.
                    </p>
                </div>
            ) : (
                <div className="border rounded-md overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Prefix</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Last Used</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {keys.map((key) => (
                                <TableRow key={key.id}>
                                    <TableCell className="font-medium">{key.name}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{key.prefix}...</TableCell>
                                    <TableCell className="text-xs">{format(new Date(key.created_at), "MMM d, yyyy")}</TableCell>
                                    <TableCell className="text-xs">
                                        {key.last_used_at ? format(new Date(key.last_used_at), "MMM d, yyyy HH:mm") : "Never"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive/90 transition-colors h-8 w-8"
                                            onClick={() => handleRevokeKey(key.id, key.name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Success Dialog showing the key */}
            <Dialog open={showKeyDialog} onOpenChange={(open) => {
                if (!open) {
                    setShowKeyDialog(false);
                    clearCreatedKey();
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-green-600 gap-2">
                            <Check className="h-5 w-5" />
                            API Key Generated Successfully
                        </DialogTitle>
                        <DialogDescription>
                            Please copy your API key now. For security reasons, you will not be able to see it again.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 mt-4">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="link" className="sr-only">
                                Link
                            </Label>
                            <Input
                                id="link"
                                defaultValue={createdKey?.key}
                                readOnly
                                className="font-mono bg-muted text-muted-foreground"
                            />
                        </div>
                        <Button size="sm" className="px-3" onClick={() => createdKey?.key && copyToClipboard(createdKey.key)}>
                            <span className="sr-only">Copy</span>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogFooter className="sm:justify-start">
                        <Button
                            type="button"
                            variant="secondary"
                            className="mt-4 w-full"
                            onClick={() => {
                                setShowKeyDialog(false);
                                clearCreatedKey();
                            }}
                        >
                            I have copied the key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
