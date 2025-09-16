import React, { useState } from 'react';

const NestedFolderTree = ({ 
  folders, 
  onAddSubfolder, 
  onEditFolder, 
  onDeleteFolder, 
  level = 0,
  parentPath = []
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [editingFolder, setEditingFolder] = useState(null);

  const toggleExpanded = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getIndentStyle = (level) => {
    return {
      marginLeft: `${level * 20}px`,
      borderLeft: level > 0 ? '2px solid #e5e7eb' : 'none',
      paddingLeft: level > 0 ? '8px' : '0'
    };
  };

  const getFolderIcon = (hasSubfolders, isExpanded) => {
    if (hasSubfolders) {
      return isExpanded ? (
        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      ) : (
        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      );
    }
    return (
      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    );
  };

  return (
    <div className="space-y-1">
      {folders.map((folder) => {
        const hasSubfolders = folder.subcarpetas && folder.subcarpetas.length > 0;
        const isExpanded = expandedFolders.has(folder._id);
        const currentPath = [...parentPath, folder.name];

        return (
          <div key={folder._id} className="group">
            <div 
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors"
              style={getIndentStyle(level)}
            >
              <div className="flex items-center space-x-2 flex-1">
                <button
                  onClick={() => hasSubfolders && toggleExpanded(folder._id)}
                  className="flex items-center space-x-2 hover:bg-gray-100 rounded p-1"
                  disabled={!hasSubfolders}
                >
                  {getFolderIcon(hasSubfolders, isExpanded)}
                  <span className={`font-medium ${level === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                    {folder.name}
                  </span>
                </button>
                
                {/* Ruta de navegación */}
                <span className="text-xs text-gray-400">
                  {currentPath.join(' > ')}
                </span>
              </div>

              {/* Contador de archivos */}
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {folder.files?.length || 0} archivos
              </span>

              {/* Acciones */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onAddSubfolder(folder)}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  title="Agregar subcarpeta"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                
                <button
                  onClick={() => onEditFolder(folder)}
                  className="p-1 text-yellow-600 hover:bg-yellow-100 rounded"
                  title="Editar carpeta"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => onDeleteFolder(folder)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                  title="Eliminar carpeta"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Subcarpetas */}
            {hasSubfolders && isExpanded && (
              <NestedFolderTree
                folders={folder.subcarpetas}
                onAddSubfolder={onAddSubfolder}
                onEditFolder={onEditFolder}
                onDeleteFolder={onDeleteFolder}
                level={level + 1}
                parentPath={currentPath}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default NestedFolderTree;
