import { ActionPanel, List, Action, showToast, Toast, Icon, getPreferenceValues, LocalStorage } from "@raycast/api";
import { exec } from "child_process";
import { readdirSync, statSync } from "fs";
import { homedir } from "os";
import { useState, useEffect } from "react";
import { join, extname } from "path";
import React from "react";

interface Preferences {
  loginFolder: string;
}

interface LoginFile {
  name: string;
  path: string;
  extension: string;
  modified: Date;
}

const RECENT_FILES_KEY = "recent_files";
const MAX_RECENT_FILES = 3;

// Allowed text document extensions
const ALLOWED_EXTENSIONS = [
  ".txt",
  ".rtf",
  ".doc",
  ".docx",
  ".pages",
  ".odt",
  ".rtfd",
  ".text",
];

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const loginFolderPath = preferences.loginFolder.replace(/^~/, homedir());

  const [searchText, setSearchText] = useState("");
  const [files, setFiles] = useState<LoginFile[]>([]);
  const [recentFilePaths, setRecentFilePaths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFiles() {
      try {
        // Load recent files from storage
        const recentData = await LocalStorage.getItem<string>(RECENT_FILES_KEY);
        const loadedRecent = recentData ? JSON.parse(recentData) : [];
        setRecentFilePaths(loadedRecent);

        const allFiles = readdirSync(loginFolderPath, { withFileTypes: true })
          .filter((dirent) => dirent.isFile())
          .filter((dirent) => !dirent.name.startsWith("."))
          .map((dirent) => {
            const filePath = join(loginFolderPath, dirent.name);
            const stats = statSync(filePath);
            return {
              name: dirent.name,
              path: filePath,
              extension: extname(dirent.name).toLowerCase(),
              modified: stats.mtime,
            };
          })
          .filter((file) => ALLOWED_EXTENSIONS.includes(file.extension))
          .sort((a, b) => b.modified.getTime() - a.modified.getTime());

        setFiles(allFiles);
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to read login folder",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadFiles();
  }, [loginFolderPath]);

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Categorize files - recently opened vs all other files
  const recentFiles = filteredFiles.filter((file) => recentFilePaths.includes(file.path));
  const otherFiles = filteredFiles.filter((file) => !recentFilePaths.includes(file.path));

  // Sort recent files by their position in the recent list (most recent first)
  recentFiles.sort((a, b) => {
    const aIndex = recentFilePaths.indexOf(a.path);
    const bIndex = recentFilePaths.indexOf(b.path);
    return aIndex - bIndex;
  });

  async function addToRecent(file: LoginFile) {
    const newRecent = [file.path, ...recentFilePaths.filter((path) => path !== file.path)].slice(
      0,
      MAX_RECENT_FILES
    );

    setRecentFilePaths(newRecent);
    await LocalStorage.setItem(RECENT_FILES_KEY, JSON.stringify(newRecent));
  }

  async function openFile(file: LoginFile) {
    await addToRecent(file);

    exec(`open "${file.path}"`, async (error) => {
      if (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to open file",
          message: error.message,
        });
        return;
      }

      await showToast({
        style: Toast.Style.Success,
        title: `Opened ${file.name}`,
      });
    });
  }

  function getFileIcon(extension: string): Icon {
    switch (extension) {
      case ".txt":
        return Icon.Document;
      case ".rtf":
        return Icon.Document;
      case ".doc":
      case ".docx":
        return Icon.Document;
      case ".pages":
        return Icon.Document;
      case ".odt":
        return Icon.Document;
      default:
        return Icon.Document;
    }
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search login files..."
      onSearchTextChange={setSearchText}
      throttle
    >
      {filteredFiles.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Document}
          title="No login files found"
          description={searchText ? `No matches for "${searchText}"` : "No files in the login folder"}
        />
      ) : (
        <>
          {recentFiles.length > 0 && (
            <List.Section title="Recently Opened" subtitle={`${recentFiles.length} files`}>
              {recentFiles.map((file) => (
                <List.Item
                  key={file.path}
                  title={file.name}
                  icon={getFileIcon(file.extension)}
                  accessories={[
                    { icon: Icon.Clock, tooltip: "Recently opened" },
                  ]}
                  actions={
                    <ActionPanel>
                      <Action title="Open" onAction={() => openFile(file)} icon={Icon.Document} />
                      <Action.ShowInFinder path={file.path} />
                      <Action.CopyToClipboard title="Copy Path" content={file.path} />
                      <Action.CopyToClipboard
                        title="Copy File Name"
                        content={file.name}
                        shortcut={{ modifiers: ["cmd"], key: "c" }}
                      />
                    </ActionPanel>
                  }
                />
              ))}
            </List.Section>
          )}

          {otherFiles.length > 0 && (
            <List.Section title="All Files" subtitle={`${otherFiles.length} files`}>
              {otherFiles.map((file) => (
                <List.Item
                  key={file.path}
                  title={file.name}
                  icon={getFileIcon(file.extension)}
                  actions={
                    <ActionPanel>
                      <Action title="Open" onAction={() => openFile(file)} icon={Icon.Document} />
                      <Action.ShowInFinder path={file.path} />
                      <Action.CopyToClipboard title="Copy Path" content={file.path} />
                      <Action.CopyToClipboard
                        title="Copy File Name"
                        content={file.name}
                        shortcut={{ modifiers: ["cmd"], key: "c" }}
                      />
                    </ActionPanel>
                  }
                />
              ))}
            </List.Section>
          )}
        </>
      )}
    </List>
  );
}
