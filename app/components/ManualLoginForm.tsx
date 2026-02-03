'use client';

import { setManualToken } from '../actions';

export default function ManualLoginForm() {
  return (
    <div className="w-full mt-8">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-gray-50 px-2 text-gray-500">Or use Access Token</span>
        </div>
      </div>

      <form action={setManualToken} className="mt-6">
        <div>
          <label htmlFor="token" className="sr-only">
            Personal Access Token
          </label>
          <input
            type="password"
            name="token"
            id="token"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="Personal Access Token"
            required
          />
        </div>
        <div className="mt-3">
            <button
            type="submit"
            className="flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
            Continue with Token
            </button>
        </div>
      </form>
    </div>
  );
}
