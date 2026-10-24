import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import type { Professional } from "@/types";
import {
  Alert,
  Avatar,
  Badge,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Spinner,
} from "@/components/ui";

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadSpecializations = async () => {
      try {
        const response = await api.get<Professional[]>("/professionals");
        if (!cancelled) {
          const unique = Array.from(
            new Set(response.data.map((item) => item.specialization))
          ).sort();
          setSpecializations(unique);
        }
      } catch (err) {
        console.error("Could not load specializations:", err);
      }
    };

    void loadSpecializations();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get<Professional[]>("/professionals", {
          params: {
            search: search.trim() || undefined,
            specialization: specialization || undefined,
          },
        });

        if (!cancelled) {
          setProfessionals(response.data);
        }
      } catch (err) {
        console.error("Could not load professionals:", err);
        if (!cancelled) {
          setError("Could not load professionals. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, specialization]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Support"
        title="Find a professional"
        description="Browse verified mental health professionals and book a session that works for you."
      />

      <Card className="p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, specialization or qualification"
            aria-label="Search professionals"
          />

          <Select
            value={specialization}
            onChange={(event) => setSpecialization(event.target.value)}
            aria-label="Filter by specialization"
          >
            <option value="">All specializations</option>
            {specializations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {error && <Alert tone="danger">{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-500">
          <Spinner className="text-brand-500" />
          Loading professionals...
        </div>
      ) : professionals.length === 0 ? (
        <EmptyState
          title="No professionals found"
          description="No professionals match your search right now. Try a different search or specialization."
          icon="🔍"
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {professionals.map((professional) => (
            <Link
              key={professional.id}
              to={`/professionals/${professional.id}`}
              className="block focus:outline-none"
            >
              <Card interactive className="h-full p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar name={professional.full_name} />

                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-ink-900">
                        {professional.full_name}
                      </h2>

                      <p className="mt-0.5 truncate text-sm font-medium text-brand-600">
                        {professional.specialization}
                      </p>
                    </div>
                  </div>

                  <Badge tone="brand" className="shrink-0">
                    {professional.years_experience} yrs
                  </Badge>
                </div>

                {professional.bio && (
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-ink-500">
                    {professional.bio}
                  </p>
                )}

                {professional.consultation_types &&
                  professional.consultation_types.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {professional.consultation_types.map((type) => (
                        <Badge key={type} tone="neutral">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
