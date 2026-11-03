import { useEffect, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Hash,
FolderKanban,
MessageSquareText, Search as SearchIcon, Ticket } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import { useAuth } from "../../contexts/useAuth.jsx";
import { api } from "../../services/apiClient.js";

export default function SearchPage() {
  const { activeWorkspace } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);
  const searchQuery = useQuery({
    queryKey: ["global-search", activeWorkspace?.id, debouncedQuery],
    enabled: Boolean(activeWorkspace?.id && debouncedQuery.length >= 2),
    queryFn: async () => {
      const params = new URLSearchParams({
        workspaceId: activeWorkspace.id,
        query: debouncedQuery,
      });
      return await api.get(`/search?${params.toString()}`);
    },
  });

  return (
    <VStack align="stretch" spacing={5} maxW="960px" mx="auto">
      <Box>
        <Text color="textMuted" fontSize="xs" fontWeight="700" letterSpacing="0.12em" textTransform="uppercase">Workspace discovery</Text>
        <Text mt={2} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="700">Search</Text>
        <Text mt={1} color="textSecondary">Find accessible projects, issues, channels, and recent messages across this workspace.</Text>
      </Box>
      <HStack position="relative">
        <SearchIcon size={17} />
        <Input
          autoFocus
          aria-label="Search workspace"
          placeholder="Search by project name, issue title, or key"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          maxW="720px"
        />
      </HStack>
      {searchQuery.isFetching && <HStack py={6}><Spinner color="accent" /><Text color="textSecondary">Searching…</Text></HStack>}
      {searchQuery.error && <Alert status="error" borderRadius="16px"><AlertIcon />{searchQuery.error.message}</Alert>}
      {query.trim().length > 0 && query.trim().length < 2 && (
        <Text color="textMuted" fontSize="sm">Enter at least 2 characters to search.</Text>
      )}
      {debouncedQuery.length >= 2 && searchQuery.isSuccess && (
        <VStack align="stretch" spacing={2}>
          {searchQuery.data.limited && (
            <Alert status="info" borderRadius="12px">
              <AlertIcon />
              Showing up to 40 matches across recent conversations; older matches may be omitted.
            </Alert>
          )}
          {!searchQuery.data.results?.length && <Text py={8} color="textMuted" textAlign="center">No matching workspace items.</Text>}
          {(searchQuery.data.results || []).map((result) => {
            const Icon = {
              project: FolderKanban,
              issue: Ticket,
              channel: Hash,
              message: MessageSquareText,
            }[result.type] || SearchIcon;
            return (
              <Card
                key={`${result.type}-${result.id}`}
                as="button"
                type="button"
                className="p-4 text-left"
                textAlign="left"
                onClick={() => navigate(result.href)}
                _hover={{ borderColor: "accentBorder", bg: "surfaceRaised" }}
              >
                <HStack>
                  <Icon size={17} />
                  <Box minW="0">
                    <Text fontWeight="600" noOfLines={1}>{result.title}</Text>
                    <Text color="textMuted" fontSize="xs" noOfLines={1}>{result.type} · {result.subtitle}</Text>
                  </Box>
                </HStack>
              </Card>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
}
