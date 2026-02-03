import { checkAuth, getData, logout } from './actions';
import ClockInForm from './components/ClockInForm';
import ManualLoginForm from './components/ManualLoginForm';
import Link from 'next/link';

export default async function Home() {
  const isAuthenticated = await checkAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-lg shadow">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Moneybird Clock</h2>
                <p className="mt-2 text-sm text-gray-600">Sign in to start tracking time</p>
            </div>

            <div className="mt-8">
                <Link 
                href="/api/auth/login"
                className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                Login with Moneybird
                </Link>

                <ManualLoginForm />
            </div>
        </div>
      </div>
    );
  }

  const data = await getData();

  if (!data) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="text-red-600 mb-4">Error loading data. Please try again.</div>
            <form action={logout}>
                <button className="underline text-gray-600">Logout</button>
            </form>
        </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Moneybird Clock</h1>
                <form action={logout}>
                    <button className="text-sm text-gray-600 hover:text-gray-900">Logout</button>
                </form>
            </div>
            
            <ClockInForm 
                users={data.users || []} 
                projects={data.projects || []} 
                contacts={data.contacts || []} 
            />
        </div>
    </main>
  );
}
