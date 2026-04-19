"use client";
import { useEffect, useState } from "react";
import { supabase } from "./utils/supabaseClient";
import Head from "next/head";

// Define Student type for TypeScript
interface Student {
  name: string;
  class: string;
  attendance: number;
  fees_status: string;
  grade: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    teachers: 0,
    pendingFees: 0,
    averageGrade: "-",
  });
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    async function fetchStats() {
      // Example: Fetch total students
      const { count: totalStudents } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      // Example: Fetch teachers count
      const { count: teachers } = await supabase
        .from("teachers")
        .select("*", { count: "exact", head: true });

      // Example: Fetch pending fees
      const { data: fees } = await supabase
        .from("fees")
        .select("amount, status");
      const pendingFees = fees
        ? fees.filter((f: any) => f.status === "pending").reduce((sum: number, f: any) => sum + f.amount, 0)
        : 0;

      // Example: Fetch average grade
      const { data: grades } = await supabase
        .from("grades")
        .select("grade");
      const averageGrade =
        grades && grades.length
          ? (
              grades.reduce((sum: number, g: any) => sum + (g.grade || 0), 0) /
              grades.length
            ).toFixed(2)
          : "-";

      setStats({
        totalStudents: totalStudents || 0,
        teachers: teachers || 0,
        pendingFees,
        averageGrade,
      });
    }

    async function fetchStudents() {
      const { data } = await supabase
        .from("students")
        .select("name, class, attendance, fees_status, grade");
      setStudents(data || []);
    }

    fetchStats();
    fetchStudents();
  }, []);

  return (
    <>
      <Head>
        <title>School Management Dashboard</title>
        {/* Bootstrap 5 CDN */}
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM"
          crossOrigin="anonymous"
        />
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-kenU1KFdBIe4zVF0s0G1M5b4hcpxyD9F7jL+AMvyTG2Fd3jDg/a6ztQ5P0hJg6gD"
          crossOrigin="anonymous"
        ></script>
      </Head>
      <div className="d-flex" style={{ minHeight: "100vh" }}>
        {/* Sidebar */}
        <nav
          className="d-flex flex-column shrink-0 p-3 bg-dark text-white"
          style={{ width: "240px", minHeight: "100vh", position: "fixed" }}
        >
          <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
            <span className="fs-4">SMS Dashboard</span>
          </a>
          <hr />
          <ul className="nav nav-pills flex-column mb-auto">
            <li className="nav-item">
              <a href="#" className="nav-link active text-white" aria-current="page">
                Dashboard
              </a>
            </li>
            <li>
              <a href="#" className="nav-link text-white">
                Students
              </a>
            </li>
            <li>
              <a href="#" className="nav-link text-white">
                Fees
              </a>
            </li>
            <li>
              <a href="#" className="nav-link text-white">
                Grades
              </a>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <div className="flex-grow-1" style={{ marginLeft: "240px" }}>
          {/* Top Navbar */}
          <nav className="navbar navbar-expand navbar-light bg-light shadow-sm">
            <div className="container-fluid">
              <span className="navbar-brand mb-0 h1">Welcome, Admin</span>
            </div>
          </nav>

          <div className="container-fluid py-4">
            {/* Quick Stats Row */}
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div className="card text-bg-primary h-100">
                  <div className="card-body">
                    <h5 className="card-title">Total Students</h5>
                    <p className="card-text fs-3">{stats.totalStudents}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-bg-success h-100">
                  <div className="card-body">
                    <h5 className="card-title">Teachers</h5>
                    <p className="card-text fs-3">{stats.teachers}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-bg-warning h-100">
                  <div className="card-body">
                    <h5 className="card-title">Pending Fees</h5>
                    <p className="card-text fs-3">₦{stats.pendingFees}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-bg-info h-100">
                  <div className="card-body">
                    <h5 className="card-title">Average Grade</h5>
                    <p className="card-text fs-3">{stats.averageGrade}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Overview Table */}
            <div className="card">
              <div className="card-header">Student Overview</div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-striped mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Class</th>
                        <th>Attendance</th>
                        <th>Fees Status</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.name + student.class}>
                          <td>{student.name}</td>
                          <td>{student.class}</td>
                          <td>{student.attendance}%</td>
                          <td>
                            <span className={`badge ${student.fees_status === "Paid" ? "bg-success" : "bg-warning text-dark"}`}>
                              {student.fees_status}
                            </span>
                          </td>
                          <td>{student.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* End Student Overview Table */}
          </div>
        </div>
      </div>
    </>
  );
}
