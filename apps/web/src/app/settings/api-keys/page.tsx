"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Skeleton,
} from "@/components/ui";

interface ApiKey {
    id: string;
    name: string;
    keyPrefix: string;
    scopes: string[];
    scopeDescriptions: Array<{ scope: string; summary: string }>;
    lastUsedAt: string | null;
    expiresAt: string | null;
    isActive: boolean;
    isExpired: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ApiKeyResponse {
    apiKeys: ApiKey[];
    availableScopes: Array<{ scope: string; summary: string }>;
    metadata: {
        total: number;
        active: number;
        expired: number;
    };
}

export default function ApiKeysPage() {
    const { data: session } = useSession();
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [availableScopes, setAvailableScopes] = useState<
        Array<{ scope: string; summary: string }>
    >([]);
    const [metadata, setMetadata] = useState({
        total: 0,
        active: 0,
        expired: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newApiKey, setNewApiKey] = useState<string | null>(null);

    // Form state
    const [keyName, setKeyName] = useState("");
    const [selectedScopes, setSelectedScopes] = useState<string[]>([
        "stories:read",
        "chapters:read",
        "analysis:read",
    ]);
    const [expirationOption, setExpirationOption] = useState<string>("never");

    // Fetch API keys
    const fetchApiKeys = async () => {
        try {
            const response = await fetch("/api/settings/api-keys");
            if (response.ok) {
                const data: ApiKeyResponse = await response.json();
                setApiKeys(data.apiKeys);
                setAvailableScopes(data.availableScopes);
                setMetadata(data.metadata);
            } else {
                toast.error("Failed to fetch API keys");
            }
        } catch (error) {
            console.error("Error fetching API keys:", error);
            toast.error("Failed to fetch API keys");
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize hooks BEFORE conditional returns
    useEffect(() => {
        if (session?.user?.id) {
            fetchApiKeys();
        }
    }, [session?.user?.id]);

    // Show loading state for unauthenticated users AFTER all hooks
    if (!session?.user?.id) {
        return <div>Please sign in to manage your API keys.</div>;
    }

    // Create new API key
    const handleCreateApiKey = async () => {
        if (!keyName.trim()) {
            toast.error("Please enter a name for your API key");
            return;
        }

        if (selectedScopes.length === 0) {
            toast.error("Please select at least one scope");
            return;
        }

        setIsCreating(true);
        try {
            const expiresAt =
                expirationOption === "never"
                    ? null
                    : getExpirationDate(expirationOption);

            const response = await fetch("/api/settings/api-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: keyName,
                    scopes: selectedScopes,
                    expiresAt: expiresAt?.toISOString() || null,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setNewApiKey(data.apiKey.key);
                setShowCreateForm(false);
                setKeyName("");
                setSelectedScopes([
                    "stories:read",
                    "chapters:read",
                    "analysis:read",
                ]);
                setExpirationOption("never");
                await fetchApiKeys();
                toast.success("API key created successfully");
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to create API key");
            }
        } catch (error) {
            console.error("Error creating API key:", error);
            toast.error("Failed to create API key");
        } finally {
            setIsCreating(false);
        }
    };

    // Revoke API key
    const handleRevokeApiKey = async (keyId: string) => {
        if (
            !confirm(
                "Are you sure you want to revoke this API key? This action cannot be undone.",
            )
        ) {
            return;
        }

        try {
            const response = await fetch(
                `/api/settings/api-keys/${keyId}/revoke`,
                {
                    method: "POST",
                },
            );

            if (response.ok) {
                await fetchApiKeys();
                toast.success("API key revoked successfully");
            } else {
                toast.error("Failed to revoke API key");
            }
        } catch (error) {
            console.error("Error revoking API key:", error);
            toast.error("Failed to revoke API key");
        }
    };

    // Delete API key
    const handleDeleteApiKey = async (keyId: string) => {
        if (
            !confirm(
                "Are you sure you want to delete this API key? This action cannot be undone.",
            )
        ) {
            return;
        }

        try {
            const response = await fetch(`/api/settings/api-keys/${keyId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                await fetchApiKeys();
                toast.success("API key deleted successfully");
            } else {
                toast.error("Failed to delete API key");
            }
        } catch (error) {
            console.error("Error deleting API key:", error);
            toast.error("Failed to delete API key");
        }
    };

    // Get expiration date based on option
    const getExpirationDate = (option: string): Date | null => {
        const now = new Date();
        switch (option) {
            case "7days":
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            case "30days":
                return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            case "90days":
                return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
            case "1year":
                return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
            default:
                return null;
        }
    };

    // Format date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Never";
        return new Date(dateString).toLocaleDateString();
    };

    // Show loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>🔑 API Keys</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full mb-4" />
                        <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* New API Key Display */}
            {newApiKey && (
                <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                    <CardHeader>
                        <CardTitle className="text-green-800 dark:text-green-200">
                            ✅ API Key Created Successfully
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-sm text-green-700 dark:text-green-300">
                                ⚠️ Save this API key now. You won&apos;t be able
                                to see it again.
                            </p>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-green-300 dark:border-green-700">
                                <code className="text-sm font-mono break-all text-gray-900 dark:text-gray-100">
                                    {newApiKey}
                                </code>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            newApiKey,
                                        );
                                        toast.success(
                                            "API key copied to clipboard",
                                        );
                                    }}
                                    variant="outline"
                                    size="sm"
                                >
                                    📋 Copy
                                </Button>
                                <Button
                                    onClick={() => setNewApiKey(null)}
                                    variant="outline"
                                    size="sm"
                                >
                                    ✖️ Dismiss
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* API Keys Management */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>🔑 API Keys</CardTitle>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Generate API keys to access your Fictures data
                                programmatically
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowCreateForm(true)}
                            disabled={showCreateForm}
                        >
                            + Generate New Key
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                {metadata.total}
                            </div>
                            <div className="text-sm text-blue-700 dark:text-blue-300">
                                Total Keys
                            </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                                {metadata.active}
                            </div>
                            <div className="text-sm text-green-700 dark:text-green-300">
                                Active Keys
                            </div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                                {metadata.expired}
                            </div>
                            <div className="text-sm text-red-700 dark:text-red-300">
                                Expired Keys
                            </div>
                        </div>
                    </div>

                    {/* Create Form */}
                    {showCreateForm && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-6 space-y-4">
                            <h3 className="text-lg font-semibold">
                                Create New API Key
                            </h3>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Key Name
                                </label>
                                <input
                                    type="text"
                                    value={keyName}
                                    onChange={(e) => setKeyName(e.target.value)}
                                    placeholder="e.g., Mobile App, Analytics Dashboard"
                                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Permissions
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                    {availableScopes.map((scope) => (
                                        <label
                                            key={scope.scope}
                                            className="flex items-center space-x-2"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedScopes.includes(
                                                    scope.scope,
                                                )}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedScopes([
                                                            ...selectedScopes,
                                                            scope.scope,
                                                        ]);
                                                    } else {
                                                        setSelectedScopes(
                                                            selectedScopes.filter(
                                                                (s) =>
                                                                    s !==
                                                                    scope.scope,
                                                            ),
                                                        );
                                                    }
                                                }}
                                                className="rounded"
                                            />
                                            <div className="text-sm">
                                                <div className="font-medium">
                                                    {scope.scope}
                                                </div>
                                                <div className="text-gray-600 dark:text-gray-400 text-xs">
                                                    {scope.summary}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Expiration
                                </label>
                                <select
                                    value={expirationOption}
                                    onChange={(e) =>
                                        setExpirationOption(e.target.value)
                                    }
                                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="never">Never expires</option>
                                    <option value="7days">7 days</option>
                                    <option value="30days">30 days</option>
                                    <option value="90days">90 days</option>
                                    <option value="1year">1 year</option>
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleCreateApiKey}
                                    disabled={isCreating}
                                >
                                    {isCreating
                                        ? "Creating..."
                                        : "Create API Key"}
                                </Button>
                                <Button
                                    onClick={() => setShowCreateForm(false)}
                                    variant="outline"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* API Keys List */}
                    {apiKeys.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No API keys found. Create your first API key to get
                            started.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {apiKeys.map((apiKey) => (
                                <div
                                    key={apiKey.id}
                                    className={`border rounded-lg p-4 ${
                                        !apiKey.isActive || apiKey.isExpired
                                            ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                                            : "border-gray-200 dark:border-gray-700"
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold">
                                                    {apiKey.name}
                                                </h4>
                                                {!apiKey.isActive && (
                                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                                        Revoked
                                                    </span>
                                                )}
                                                {apiKey.isExpired && (
                                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                                        Expired
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                <div>
                                                    <strong>Key:</strong>{" "}
                                                    <code>
                                                        {apiKey.keyPrefix}...
                                                    </code>
                                                </div>
                                                <div>
                                                    <strong>Created:</strong>{" "}
                                                    {formatDate(
                                                        apiKey.createdAt,
                                                    )}
                                                </div>
                                                <div>
                                                    <strong>Last used:</strong>{" "}
                                                    {formatDate(
                                                        apiKey.lastUsedAt,
                                                    )}
                                                </div>
                                                <div>
                                                    <strong>Expires:</strong>{" "}
                                                    {formatDate(
                                                        apiKey.expiresAt,
                                                    )}
                                                </div>
                                                <div>
                                                    <strong>Scopes:</strong>{" "}
                                                    {apiKey.scopes.join(", ")}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 ml-4">
                                            {apiKey.isActive &&
                                                !apiKey.isExpired && (
                                                    <Button
                                                        onClick={() =>
                                                            handleRevokeApiKey(
                                                                apiKey.id,
                                                            )
                                                        }
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        Revoke
                                                    </Button>
                                                )}
                                            <Button
                                                onClick={() =>
                                                    handleDeleteApiKey(
                                                        apiKey.id,
                                                    )
                                                }
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Usage Instructions */}
                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            📖 Using Your API Keys
                        </h4>
                        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                            <p>
                                Include your API key in requests using one of
                                these methods:
                            </p>
                            <div className="font-mono text-xs bg-white dark:bg-blue-900 p-2 rounded">
                                <div>
                                    Header:{" "}
                                    <code>X-API-Key: your_api_key_here</code>
                                </div>
                                <div>
                                    Or:{" "}
                                    <code>
                                        Authorization: Bearer your_api_key_here
                                    </code>
                                </div>
                            </div>
                            <p>
                                <strong>Base URL:</strong>{" "}
                                <code className="bg-white dark:bg-blue-900 px-1 rounded">
                                    {window.location.origin}/api
                                </code>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
