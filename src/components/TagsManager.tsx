import React, { useState, useEffect } from "react";
import { Plus, Trash2, Tag, Loader } from "lucide-react";
import { expenseService } from "@/lib/expense-service";
import type { Tag as TagType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const TagsManager: React.FC = () => {
    const [tags, setTags] = useState<TagType[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [tagName, setTagName] = useState("");
    const [tagColor, setTagColor] = useState("#6366f1"); // Default indigo

    const fetchTags = async () => {
        setLoading(true);
        const result = await expenseService.getTags();
        if (result.success && result.data) {
            setTags(result.data);
        } else {
            toast.error("Failed to load tags");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleAddTag = async () => {
        if (!tagName.trim()) return;
        setAdding(true);
        const result = await expenseService.createTag(tagName, tagColor);
        if (result.success && result.data) {
            toast.success("Tag created");
            setTags([...tags, result.data]);
            setTagName("");
        } else {
            toast.error(result.error || "Failed to create tag");
        }
        setAdding(false);
    };

    const handleDeleteTag = async (id: string) => {
        if (!confirm("Are you sure you want to delete this tag?")) return;

        // Optimistic update
        setTags(tags.filter(t => t.id !== id));

        const result = await expenseService.deleteTag(id);
        if (!result.success) {
            toast.error("Failed to delete tag");
            fetchTags(); // Revert
        } else {
            toast.success("Tag deleted");
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-medium">Tags</h3>
                <p className="text-sm text-muted-foreground">
                    Manage tags to organize your expenses.
                </p>
            </div>

            <div className="flex gap-2 items-end">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="tag-name">New Tag Name</Label>
                    <Input
                        type="text"
                        id="tag-name"
                        placeholder="e.g. Vacation, Urgent"
                        value={tagName}
                        onChange={(e) => setTagName(e.target.value)}
                    />
                </div>
                <div className="grid items-center gap-1.5">
                    <Label htmlFor="tag-color">Color</Label>
                    <Input
                        type="color"
                        id="tag-color"
                        value={tagColor}
                        onChange={(e) => setTagColor(e.target.value)}
                        className="w-12 p-1 h-10"
                    />
                </div>
                <Button onClick={handleAddTag} disabled={adding || !tagName.trim()}>
                    {adding ? <Loader className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add
                </Button>
            </div>

            <div className="border rounded-md p-4 min-h-[100px]">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : tags.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No tags created yet.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <Badge
                                key={tag.id}
                                variant="outline"
                                className="pl-2 pr-1 py-1 flex items-center gap-1 text-sm pointer-events-none"
                                style={{ borderColor: tag.color || '#e2e8f0', backgroundColor: (tag.color || '#e2e8f0') + '20' }}
                            >
                                <Tag className="h-3 w-3 mr-1" style={{ color: tag.color || 'currentColor' }} />
                                {tag.name}
                                <button
                                    className="ml-2 hover:bg-destructive/10 rounded-full p-0.5 pointer-events-auto cursor-pointer"
                                    onClick={() => handleDeleteTag(tag.id)}
                                >
                                    <XIcon className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

function XIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}
