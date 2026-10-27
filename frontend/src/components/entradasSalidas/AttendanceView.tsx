"use client";

import React, { useState } from "react";
import TopBar from "./TopBar";
import PageHeader from "./PageHeader";
import ManualRegistrationCard from "./ManualRegistrationCard";
import DailyAttendanceCard from "./DailyAttendanceCard";
import { INITIAL_ATTENDANCE_RECORDS } from "@/services/mockAttendanceData";
import { AttendanceRecord, Employee } from "@/types/attendance";

export default function AttendanceView() {
  const [records, setRecords] = useState<AttendanceRecord[]>(
    INITIAL_ATTENDANCE_RECORDS
  );
  const [globalSearch, setGlobalSearch] = useState<string>("");

  const handleRegisterCheckIn = (employee: Employee) => {
    const now = new Date();
    const timeFormatted = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    setRecords((prev) => {
      const existingIndex = prev.findIndex((r) => r.employeeId === employee.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status: "presente",
          checkIn: timeFormatted,
          checkOut: "En curso",
        };
        return updated;
      } else {
        const newRecord: AttendanceRecord = {
          id: `rec-${Date.now()}`,
          employeeId: employee.id,
          name: employee.name,
          department: employee.department,
          shift: employee.shift,
          shiftTime: employee.startTime,
          status: "presente",
          checkIn: timeFormatted,
          checkOut: "En curso",
          hours: "0h 01m",
          note: null,
        };
        return [newRecord, ...prev];
      }
    });
  };

  const handleRegisterCheckOut = (employee: Employee) => {
    const now = new Date();
    const timeFormatted = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.employeeId === employee.id) {
          return {
            ...rec,
            checkOut: timeFormatted,
            hours: "8h 00m",
          };
        }
        return rec;
      })
    );
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Top Bar with Date, Search and AI Button */}
      <TopBar
        searchQuery={globalSearch}
        onSearchChange={setGlobalSearch}
        onAiAssistantClick={() => alert("Asistente AI activado")}
      />

      {/* Page Title & Shift Badge */}
      <PageHeader />

      {/* Main 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Manual Registration Card (5 of 12 cols on desktop) */}
        <div className="lg:col-span-5">
          <ManualRegistrationCard
            onRegisterCheckIn={handleRegisterCheckIn}
            onRegisterCheckOut={handleRegisterCheckOut}
          />
        </div>

        {/* Right Column: Daily Attendance Table Card (7 of 12 cols on desktop) */}
        <div className="lg:col-span-7">
          <DailyAttendanceCard records={records} />
        </div>
      </div>
    </div>
  );
}

