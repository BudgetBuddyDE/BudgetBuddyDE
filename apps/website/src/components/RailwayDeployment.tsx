import type { HTMLAttributes } from "react";
import NextLink from "next/link";
import NextImage from "next/image";

export default function RailwayDeployment(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={props.className}
    >
      <p>BudgetBuddyDE is designed to be easily deployable on <NextLink href="https://railway.app/" target="_blank" rel="noopener noreferrer">Railway</NextLink>.<br /></p>
      <NextLink href="https://railway.com/deploy/WjE5vD?referralCode=SD-6Xm&utm_medium=integration&utm_source=template&utm_campaign=generic" target="_blank" rel="noopener noreferrer">
        <NextImage src="https://railway.com/button.svg" alt="Deploy on Railway" width={190} height={90} style={{marginTop: "unset"}} />
      </NextLink>
    </div>
  );
}
