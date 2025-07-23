'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CreditBalanceData {
  balance: number;
  limit: number;
  usage: number;
}

export function CreditBalance({ teamId }: { teamId: number }) {
  const [data, setData] = useState<CreditBalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/credits/balance?teamId=${teamId}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, [teamId]);

  if (loading) {
    return <div>Loading credits...</div>;
  }

  if (!data) {
    return <div>Could not load credit balance.</div>;
  }

  const percentage = data.limit > 0 ? (data.balance / data.limit) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Balance</CardTitle>
        <CardDescription>Your available credits for this period.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">{data.balance.toLocaleString()}</div>
        <p className="text-sm text-gray-500">
          out of {data.limit.toLocaleString()}
        </p>
        <Progress value={percentage} className="mt-4" />
      </CardContent>
    </Card>
  );
}

export function CreditDashboard({ teamId }: { teamId: number }) {
  return (
    <div className="space-y-6">
      <CreditBalance teamId={teamId} />
      <UsageHistory teamId={teamId} />
      <GrantsHistory teamId={teamId} />
    </div>
  );
}

function UsageHistory({ teamId }: { teamId: number }) {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    fetch(`/api/credits/usage-history?teamId=${teamId}&limit=10`)
      .then((res) => res.json())
      .then(setHistory);
  }, [teamId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Credits Used</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell>
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{item.actionType}</TableCell>
                <TableCell>{item.creditsUsed}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function GrantsHistory({ teamId }: { teamId: number }) {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    fetch(`/api/credits/grants-history?teamId=${teamId}&limit=10`)
      .then((res) => res.json())
      .then(setHistory);
  }, [teamId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grants History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Credits Granted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell>
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{item.grantReason}</TableCell>
                <TableCell>{item.creditsGranted}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function useCreditCheck(teamId: number, requiredCredits: number) {
  const [hasSufficientCredits, setHasSufficientCredits] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId) {
      fetch(`/api/credits/balance?teamId=${teamId}`)
        .then((res) => res.json())
        .then((data) => {
          setHasSufficientCredits(data.balance >= requiredCredits);
          setLoading(false);
        });
    }
  }, [teamId, requiredCredits]);

  return { hasSufficientCredits, loading };
}
