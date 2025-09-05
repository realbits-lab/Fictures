import { auth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";

export default async function AccountSettingsPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>👤 Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Display Name
              </label>
              <input
                type="text"
                defaultValue={session?.user?.name || ""}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Email Address
              </label>
              <input
                type="email"
                defaultValue={session?.user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed as it&apos;s managed by OAuth provider
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Bio
            </label>
            <textarea
              rows={3}
              placeholder="Tell us about yourself as a writer..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Profile Image
            </label>
            <div className="flex items-center gap-4">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'Profile'}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-2xl text-gray-500 dark:text-gray-400">
                    {session?.user?.name?.[0] || 'U'}
                  </span>
                </div>
              )}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Profile image is managed by your OAuth provider (Google)
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button>Save Changes</Button>
            <Button variant="ghost">Cancel</Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Account Type:</span>
              <div className="text-gray-900 dark:text-gray-100 capitalize">
                {session?.user?.role || 'User'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Member Since:</span>
              <div className="text-gray-900 dark:text-gray-100">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}