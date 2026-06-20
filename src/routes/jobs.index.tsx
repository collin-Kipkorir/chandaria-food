import React from "react";
import { Badge } from "@/components/ui/badge";

function StatCard({ title, subtitle }: { title: React.ReactNode; subtitle: string }) {
	return (
		<div className="rounded-lg bg-card p-4 shadow-sm">
			<div className="text-lg font-semibold">{title}</div>
			<div className="text-xs text-muted-foreground">{subtitle}</div>
		</div>
	);
}

export default function JobsIndex() {
	return (
		<div className="max-w-6xl mx-auto px-4 py-16">
			<div className="text-center">
				<Badge className="mb-4 bg-brand-green text-brand-cream">JOIN THE TEAM</Badge>
				<h2 className="text-4xl font-extrabold tracking-tight">
					OPEN <span className="text-brand-gold">POSITIONS</span>
				</h2>
				<p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
					We are always looking for energetic, caring individuals to join our growing team. Apply directly — no agencies, no middlemen.
				</p>
			</div>

			<div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
				<StatCard title={<><span className="text-2xl font-bold">8</span></>} subtitle="OPEN ROLES" />
				<StatCard title={<><span className="text-2xl font-bold">NBI · MSA</span></>} subtitle="LOCATIONS HIRING" />
				<StatCard title={<><span className="text-2xl font-bold">72H</span></>} subtitle="RESPONSE TIME" />
				<StatCard title={<><span className="text-2xl font-bold">FREE</span></>} subtitle="TRAINING PROVIDED" />
			</div>

			<div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
				<div className="col-span-1 rounded-lg bg-card p-6 shadow-sm flex items-start gap-4">
					<div className="text-brand-green mt-1">🌱</div>
					<div>
						<div className="font-semibold">Growth</div>
						<div className="text-sm text-muted-foreground">Clear career paths from store to HQ</div>
					</div>
				</div>
				<div className="col-span-1 rounded-lg bg-card p-6 shadow-sm flex items-start gap-4">
					<div className="text-brand-green mt-1">🩺</div>
					<div>
						<div className="font-semibold">Medical</div>
						<div className="text-sm text-muted-foreground">Comprehensive health cover for staff</div>
					</div>
				</div>
				<div className="col-span-1 rounded-lg bg-card p-6 shadow-sm flex items-start gap-4">
					<div className="text-brand-green mt-1">💳</div>
					<div>
						<div className="font-semibold">Staff Discount</div>
						<div className="text-sm text-muted-foreground">Exclusive discounts on all products</div>
					</div>
				</div>
				<div className="col-span-1 rounded-lg bg-card p-6 shadow-sm flex items-start gap-4">
					<div className="text-brand-green mt-1">🎓</div>
					<div>
						<div className="font-semibold">Training</div>
						<div className="text-sm text-muted-foreground">World-class onboarding & development</div>
					</div>
				</div>
			</div>

			<div className="mt-8 flex flex-wrap gap-3">
				<button className="rounded-md border px-3 py-2 text-sm">ALL ROLES</button>
				<button className="rounded-md border bg-brand-green text-brand-cream px-3 py-2 text-sm">FULL-TIME</button>
				<button className="rounded-md border px-3 py-2 text-sm">PART-TIME</button>
				<button className="rounded-md border px-3 py-2 text-sm">NAIROBI</button>
				<button className="rounded-md border px-3 py-2 text-sm">MOMBASA</button>
				<button className="rounded-md border px-3 py-2 text-sm">STORE ROLES</button>
				<button className="rounded-md border px-3 py-2 text-sm">LOGISTICS</button>
			</div>
		</div>
	);
}
