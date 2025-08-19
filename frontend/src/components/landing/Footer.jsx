import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose md:text-left">
            Built by{" "}
            <a
              href="https://github.com/Aequilibra-Labs"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Aequilibra Labs
            </a>
            . The source code is available on{" "}
            <a
              href="https://github.com/Aequilibra-Labs/aequilibra-frontend"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <a
            href="/legal/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms
          </a>
          <a
            href="/legal/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy
          </a>
          <a
            href="/legal/risk"
            className="underline underline-offset-4 hover:text-primary"
          >
            Risk Disclosure
          </a>
        </div>
      </div>
    </footer>
  )
}
