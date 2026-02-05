import { checkAuth, getData, logout } from './actions';
import ClockInForm from './components/ClockInForm';
import ManualLoginForm from './components/ManualLoginForm';
import ClientAuthForm from './components/ClientAuthForm';

export default async function Home() {
  const isAuthenticated = await checkAuth();
  const redirectUri = process.env.REDIRECT_URI;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-lg shadow">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Moneybird Clock</h2>
                <p className="mt-2 text-sm text-gray-600">Sign in to start tracking time</p>
            </div>

            <div className="mt-8">
                <ClientAuthForm redirectUri={redirectUri} />

                <ManualLoginForm />
            </div>
        </div>
      </div>
    );
  }

  const data = await getData();

  if (!data || data.error) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="text-red-600 mb-4">{data?.error || 'Error loading data. Please try again.'}</div>
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
