"use client";

import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { HeartPulseIcon } from "lucide-react";
import { createContext, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../convex/_generated/api";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        <div className="flex items-center gap-2">
          <HeartPulseIcon className="size-6 text-red-400" />
          HealthCtx
        </div>
        <UserButton />
      </header>
      <main className="p-8 flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-center">Welcome to your health context</h1>
        <Authenticated>
          <Content />
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </>
  );
}

function SignInForm() {
  return (
    <div className="flex flex-col gap-8 w-96 mx-auto">
      <p>Log in to see the numbers</p>
      <SignInButton mode="modal">
        <button className="bg-foreground text-background px-4 py-2 rounded-md">Sign in</button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="bg-foreground text-background px-4 py-2 rounded-md">Sign up</button>
      </SignUpButton>
    </div>
  );
}

const UserContext = createContext<string>(null as any);

function Content() {
  const ensureUser = useMutation(api.users.ensureUser);
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    ensureUser().then(
      (userId) => {
        setUserId(userId);
      },
      (e) => {
        console.error(e);
      },
    );
  }, [ensureUser]);
  return userId ? (
    <UserContext.Provider value={userId}>
      <div className="container mx-auto">
        <UploadDocument />
        <ListDocuments />
      </div>
    </UserContext.Provider>
  ) : null;
}

function ListDocuments() {
  const documents = useQuery(api.documents.listDocuments, {});
  return (
    <div className="space-y-2">
      {documents?.map((document) => (
        <DocumentCard key={document._id} document={document} />
      ))}
    </div>
  );
}

type DocumentListItem = NonNullable<(typeof api.documents.listDocuments)["_returnType"]>[number];

function DocumentCard({ document }: { document: DocumentListItem }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{document.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{document.status}</p>
        <DocumentClassification classification={document.classification} />
      </CardContent>
    </Card>
  );
}

function DocumentClassification({ classification }: { classification: DocumentListItem["classification"] }) {
  if (!classification) return null;
  switch (classification.category) {
    case "testresults":
      return <div>Test results: {classification.testType}</div>;
    case "clinical-notes":
      return <div>Clinical notes: {classification.type}</div>;
    case "insurance-document":
      return <div>Insurance document</div>;
    case "non-medical":
      return <div className="text-destructive">Non-medical document: {classification.explanation}</div>;
  }
  return null;
}

function UploadDocument() {
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const processDocument = useMutation(api.documents.processDocument);

  const fileInput = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await generateUploadUrl();

    const result = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": file!.type },
      body: file,
    });
    const { storageId } = await result.json();

    await processDocument({
      storageId,
      fileName: file.name,
      type: file.type === "application/pdf" ? "pdf" : "image",
    });
  };

  return (
    <div className="flex items-center justify-center p-2">
      <input type="file" accept="image/*, application/pdf" ref={fileInput} className="hidden" onChange={handleUpload} />
      <Button onClick={() => fileInput.current?.click()} size="lg">
        Upload Document
      </Button>
    </div>
  );
}

// const uploadFileWithProgress = (
//   file: File,
//   signedUrl: string,
//   signal: AbortSignal
// ): Promise<void> => {
//   return new Promise((resolve, reject) => {
//     const xhr = new XMLHttpRequest()

//     xhr.open('PUT', signedUrl)
//     xhr.setRequestHeader('Content-Type', file.type)

//     xhr.upload.onprogress = (event) => {
//       if (event.lengthComputable) {
//         const percentComplete = (event.loaded / event.total) * 100
//         setUploadProgress(percentComplete)
//       }
//     }

//     xhr.onload = () => {
//       if (xhr.status === 200) {
//         resolve()
//       } else {
//         reject(new Error(`Upload failed with status ${xhr.status}`))
//       }
//     }

//     xhr.onerror = () => {
//       reject(new Error('Upload failed'))
//     }

//     xhr.send(file)

//     signal.addEventListener('abort', () => {
//       xhr.abort()
//       reject(new Error('Upload cancelled'))
//     })
//   })
// }

