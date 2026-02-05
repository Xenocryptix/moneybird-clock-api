'use client';

import { startManualAuth } from '../actions';

type ClientAuthFormProps = {
  redirectUri?: string;
};

export default function ClientAuthForm({ redirectUri }: ClientAuthFormProps) {
  const resolvedRedirectUri = redirectUri || '';

  return (
    <div className="w-full">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Go to <a href="https://moneybird.com/user/applications/new" target="_blank" rel="noopener noreferrer" className="font-medium underline hover:text-blue-600">User settings &gt; Developers &gt; Create OAuth application</a>
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Set the Redirect URI to: <br/>
              <code className="bg-blue-100 px-1 py-0.5 rounded select-all break-all">{resolvedRedirectUri || 'Loading...'}</code>
            </p>
          </div>
        </div>
      </div>

      <form action={startManualAuth} className="space-y-6">
        <input type="hidden" name="redirect_uri" value={resolvedRedirectUri} />
        
        <div>
          <label htmlFor="client_id" className="block text-sm font-medium leading-6 text-gray-900">
            Client ID
          </label>
          <div className="mt-2">
            <input
              id="client_id"
              name="client_id"
              type="text"
              required
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            />
          </div>
        </div>

        <div>
          <label htmlFor="client_secret" className="block text-sm font-medium leading-6 text-gray-900">
            Client Secret
          </label>
          <div className="mt-2">
            <input
              id="client_secret"
              name="client_secret"
              type="password"
              required
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!resolvedRedirectUri}
          className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          Login with Moneybird
        </button>
      </form>
    </div>
  );
}
