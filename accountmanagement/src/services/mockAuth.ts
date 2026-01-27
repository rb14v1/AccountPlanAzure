import usersData from "../data/users.json";

type User = {
  id: number;
  username: string;
  password: string;
  role: string;
};

const USERS_KEY = "mock_users";
const SESSION_KEY = "mock_session";

export function initUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(usersData));
  }
}

export function loginUser(username: string, password: string) {
  const users: User[] = JSON.parse(
    localStorage.getItem(USERS_KEY) || "[]"
  );

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    throw new Error("Invalid credentials");
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function registerUser(
  username: string,
  password: string,
  role = "user"
) {
  const users: User[] = JSON.parse(
    localStorage.getItem(USERS_KEY) || "[]"
  );

  if (users.some((u) => u.username === username)) {
    throw new Error("User already exists");
  }

  const newUser: User = {
    id: Date.now(),
    username,
    password,
    role,
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  return newUser;
}

export function getSession() {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}
