"use client"

import type React from "react"
import { useState, useEffect, ChangeEvent, FormEvent } from "react"
import { useRouter } from "next/navigation"

interface NetworkArea {
  id: number;
  area_name: string;
}

export default function AddDevice() {
  const [formData, setFormData] = useState({
    name: "",
    ip_address: "",
    location: "",
    status: "Allowed",
    area_id: "",
    latitude: "",
    longitude: "",
  });
  const [networkAreas, setNetworkAreas] = useState<NetworkArea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // ... (kode otentikasi tetap sama) ...
    const fetchAreas = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/network-areas`);
        const data = await response.json();
        setNetworkAreas(data.areas || []);
      } catch (e) {
        console.error("Failed to fetch areas", e);
      }
    };
    fetchAreas();
  }, [router]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/devices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        if (response.ok) {
            alert("Device added successfully!");
            router.push("/dashboard");
        } else {
            const data = await response.json();
            setError(data.error || "Failed to add device");
        }
    } catch (e) {
        setError("Network error");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... (Header tidak berubah) ... */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Device</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ... (input untuk name, ip_address, location, status, lat, long) ... */}
            <div>
              <label htmlFor="area_id" className="block text-sm font-semibold text-gray-700 mb-2">Network Area *</label>
              <select
                id="area_id"
                name="area_id"
                value={formData.area_id}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                required
              >
                <option value="" disabled>-- Select an Area --</option>
                {networkAreas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.area_name}
                  </option>
                ))}
              </select>
            </div>
            {/* Tombol submit dan cancel */}
            <div className="flex gap-4 pt-4">
                <button type="submit" disabled={isLoading} className="flex-1 bg-red-600 text-white py-3 rounded-xl">
                    {isLoading ? "Saving..." : "Save Device"}
                </button>
                <button type="button" onClick={() => router.back()} className="flex-1 bg-gray-200 py-3 rounded-xl">
                    Cancel
                </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}