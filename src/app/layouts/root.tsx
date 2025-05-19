import { ReactNode } from "react";
import { Header } from "../components/header";
import { Favorites } from "../components/favorites-bar";

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Favorites />
    </>
  );
}
