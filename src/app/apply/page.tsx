"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { UploadButton } from "~/utils/uploadthing";
import { Button, Card, PageHeader } from "~/components/os/primitives";

const TYPES = ["SUPPLIER", "DRIVER", "CARETAKER", "ADMIN", "CUSTOMER", "APPLICANT"] as const;
type ApplyType = (typeof TYPES)[number];

export default function UnifiedApplyPage() {
  const [type, setType] = useState<ApplyType>("APPLICANT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const apply = api.careers.submitApplication.useMutation();

  const submit = () => {
    if (!name || !email) return;
    apply.mutate({
      type,
      name,
      email,
      phone: phone || undefined,
      resumeUrl: resumeUrl || undefined,
      answers: { notes },
      source: "unified-apply",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Join"
        title="Apply"
        description="Choose a path. Existing application and review workflows stay the same."
      />
      <Card>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs text-os-muted">
            I am a
            <select value={type} onChange={(e) => setType(e.target.value as ApplyType)} className="os-field">
              {TYPES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-os-muted">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} className="os-field" />
          </label>
          <label className="text-xs text-os-muted">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="os-field" />
          </label>
          <label className="text-xs text-os-muted">
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="os-field" />
          </label>
          <div className="md:col-span-2">
            <p className="text-xs text-os-muted">Resume (optional)</p>
            <UploadButton
              endpoint="resumeUploader"
              onClientUploadComplete={(res) => {
                const url = Array.isArray(res) && res[0]?.url ? String(res[0].url) : undefined;
                if (url) setResumeUrl(url);
              }}
              onUploadError={(error: Error) => alert(error.message)}
            />
          </div>
          <label className="text-xs text-os-muted md:col-span-2">
            Notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="os-field" />
          </label>
        </div>
        <Button className="mt-4" onClick={submit} disabled={apply.isPending || !name || !email}>
          {apply.isPending ? "Submitting…" : "Submit"}
        </Button>
        {apply.isSuccess ? <p className="mt-3 text-sm text-os-success">Received. We’ll be in touch.</p> : null}
      </Card>
    </div>
  );
}
