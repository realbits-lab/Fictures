import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui";

export default function WritingPreferencesPage() {
	return (
		<div className="space-y-6">
			{/* Writing Preferences */}
			<Card>
				<CardHeader>
					<CardTitle>✏️ Writing Preferences</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
								Default Word Count Target
							</label>
							<select
								className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
								defaultValue="4,000 words"
							>
								<option>1,000 words</option>
								<option>2,000 words</option>
								<option>3,000 words</option>
								<option>4,000 words</option>
								<option>5,000 words</option>
								<option>Custom</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
								Auto-save Interval
							</label>
							<select
								className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
								defaultValue="30 seconds"
							>
								<option>15 seconds</option>
								<option>30 seconds</option>
								<option>1 minute</option>
								<option>2 minutes</option>
								<option>Disabled</option>
							</select>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
							Default Genre
						</label>
						<select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
							<option>Fantasy</option>
							<option>Science Fiction</option>
							<option>Romance</option>
							<option>Mystery</option>
							<option>Thriller</option>
							<option>Literary Fiction</option>
							<option>Young Adult</option>
							<option>Other</option>
						</select>
					</div>

					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-gray-900 dark:text-gray-100">
									Distraction-free Mode
								</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									Hide UI elements while writing
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input type="checkbox" className="sr-only peer" />
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
							</label>
						</div>

						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-gray-900 dark:text-gray-100">
									Daily Writing Goal Tracking
								</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									Track daily word count progress
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									defaultChecked
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
							</label>
						</div>

						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-gray-900 dark:text-gray-100">
									Show Writing Analytics
								</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									Display pace, emotion, and style metrics
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									defaultChecked
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
							</label>
						</div>

						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-gray-900 dark:text-gray-100">
									Spell Check
								</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									Enable real-time spell checking
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									defaultChecked
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
							</label>
						</div>
					</div>

					<div className="flex gap-3">
						<Button>Save Changes</Button>
						<Button variant="ghost">Cancel</Button>
					</div>
				</CardContent>
			</Card>

			{/* Editor Settings */}
			<Card>
				<CardHeader>
					<CardTitle>📝 Editor Settings</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
								Editor Font Size
							</label>
							<div className="flex items-center gap-4">
								<input
									type="range"
									min="12"
									max="24"
									defaultValue="16"
									className="flex-1"
								/>
								<span className="text-sm text-gray-600 dark:text-gray-400 w-8">
									16px
								</span>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
								Line Height
							</label>
							<select
								className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
								defaultValue="1.6"
							>
								<option>1.2</option>
								<option>1.4</option>
								<option>1.6</option>
								<option>1.8</option>
								<option>2.0</option>
							</select>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
							Writing Font Family
						</label>
						<select
							className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
							defaultValue="Inter (Sans-serif)"
						>
							<option>Inter (Sans-serif)</option>
							<option>Georgia (Serif)</option>
							<option>Times New Roman (Serif)</option>
							<option>Crimson Text (Serif)</option>
							<option>Source Code Pro (Monospace)</option>
							<option>JetBrains Mono (Monospace)</option>
						</select>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
