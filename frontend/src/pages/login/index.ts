import type { Route } from "@/types/routes";

class LoginComponent {
  render = () => {
    return `
            <div class="min-h-screen flex items-center justify-center bg-gray-900">
            <div class="bg-gray-800 border-4 border-gray-600 p-6 w-96">
                <h2 class="text-2xl font-extrabold mb-6 text-center text-green-400 tracking-widest">
                LOGIN
                </h2>
                <form action="#" method="POST" class="text-green-300">
                <div class="mb-4">
                    <label for="email" class="block text-sm font-bold uppercase">Username</label>
                    <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your@example.com"
                    required
                    class="mt-1 w-full px-3 py-2 bg-black text-green-300 border border-green-400 focus:outline-none"
                    />
                </div>
                <div class="mb-6">
                    <label for="password" class="block text-sm font-bold uppercase">Password</label>
                    <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    class="mt-1 w-full px-3 py-2 bg-black text-green-300 border border-green-400 focus:outline-none"
                    />
                </div>
                <div class="flex items-center mb-4">
                    <input
                    type="checkbox"
                    id="remember"
                    name="remember"
                    class="h-4 w-4 text-green-400 border-gray-500 bg-black"
                    />
                    <label for="remember" class="ml-2 text-sm">Keep Login</label>
                </div>
                <button
                    type="submit"
                    class="w-full bg-green-500 text-black py-2 px-4 border-2 border-green-400 hover:bg-green-400 font-bold uppercase tracking-widest"
                >
                    Enter
                </button>
                </form>
            </div>
            </div>
        `;
  };
}

export const LoginRoute: Record<string, Route> = {
  "/login": {
    linkLabel: "Login",
    content: new LoginComponent().render(),
  },
};
